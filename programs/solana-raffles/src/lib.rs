use anchor_lang::prelude::*;
use anchor_spl::token::{self};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::*;

declare_id!("ARH14sTAAUggnzTa7FCqsT5zkXhyZQE7pxXj8u31GLCy");


#[program]
pub mod solana_raffles {
    use super::*;

    pub fn create_raffle(
        ctx: Context<CreateRaffle>, 
        price: u64,
        ends: i64,
        title: String,
        description: String,
        image: String,
        winners:u8,
        requires_author: u8,
    ) -> Result<()> {


        if ![0,1].contains(&requires_author) {
            return Err(RaffleError::InputError.into())
        }
        if image.chars().count() > 50 {
            return Err(RaffleError::InputError.into())
        }
        if title.chars().count() > 50 {
            return Err(RaffleError::InputError.into())
        }
        if description.chars().count() > 100 {
            return Err(RaffleError::InputError.into())
        }

        let raffle = &mut ctx.accounts.raffle;
        raffle.authority = ctx.accounts.authority.key();
        raffle.ends = ends;
        raffle.price = price;
        raffle.title = title;
        raffle.description = description;
        raffle.image = image;
        raffle.winners = winners;
        raffle.requires_author = requires_author;
        raffle.token = ctx.accounts.token_mint.key();
        Ok(())
    }

    pub fn purchase_ticket(
        ctx: Context<CreateTicket>
    ) -> Result<()> {

        let clock: Clock = Clock::get().unwrap();
        let raffle  = &ctx.accounts.raffle;

        require_keys_eq!(
            ctx.accounts.raffle.authority,
            ctx.accounts.authority_ata.owner,
            RaffleError::Unauthorized
        );

        require_keys_eq!(
            ctx.accounts.raffle.token,
            ctx.accounts.token_mint.key(),
            RaffleError::Unauthorized
        );

        require_keys_eq!(
            ctx.accounts.raffle.authority,
            ctx.accounts.authority.key(),
            RaffleError::Unauthorized
        );

        if raffle.requires_author == 1 {
            require_keys_eq!(
                ctx.accounts.raffle.authority,
                ctx.accounts.need_signer.key(),
                RaffleError::Unauthorized
            );
        };

        if raffle.ends < clock.unix_timestamp {
            return Err(RaffleError::RaffleEnded.into());
        };

        let token_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                authority: ctx.accounts.participant.to_account_info(),
                from: ctx.accounts.participant_ata.to_account_info(),
                to: ctx.accounts.authority_ata.to_account_info(),
            },
        );

        token::transfer(token_ctx, raffle.price)?; 

        let ticket = &mut ctx.accounts.ticket;
        ticket.raffle = ctx.accounts.raffle.key();
        ticket.participant = ctx.accounts.participant.key();
        Ok(())
    }

    pub fn end_raffle(_ctx: Context<EndRaffle>) -> Result<()> { Ok(()) }

    pub fn close_ticket_account(_ctx: Context<CloseTicketAccount>) ->  Result<()>{ Ok(()) }

 
}

#[derive(Accounts)]
pub struct CreateRaffle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Raffle::LEN
    )]
    pub raffle: Box<Account<'info, Raffle>>,

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct CreateTicket<'info> {

    /// CHECK: we good
    pub authority: AccountInfo<'info>,

    pub need_signer: Signer<'info>,

    #[account(mut)]
    pub participant: Signer<'info>,

    #[account(mut)]
    pub raffle: Box<Account<'info, Raffle>>,

    #[account(
        init,
        payer = participant,
        space = 8 + Ticket::LEN
    )]
    pub ticket: Box<Account<'info, Ticket>>,

    #[account(mut)]
    pub participant_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = participant,
        associated_token::mint = token_mint,
        associated_token::authority = authority,
    )]
    pub authority_ata: Account<'info, TokenAccount>,

    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct EndRaffle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        has_one = authority,
        close = authority 
    )]
    pub raffle: Box<Account<'info, Raffle>>,
}

#[derive(Accounts)]
pub struct CloseTicketAccount<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    #[account(
        mut,
        has_one = participant,
        close = participant 
    )]
    pub ticket: Box<Account<'info, Ticket>>,
}

#[account]
pub struct Raffle {
    pub authority: Pubkey,
    pub ends: i64,

    pub title: String, // 50 * 4
    pub description: String, // 100 * 4
    pub image: String, //100 * 4

    pub winners: u8, //

    pub requires_author: u8,

    pub price: u64,
    pub token: Pubkey,
}

#[account]
pub struct Ticket {
    pub raffle: Pubkey,
    pub participant: Pubkey
}

impl Raffle {
    pub const LEN: usize = 32  + 8 + (50 * 4) + (100 * 4) + (100 * 4) + 1 + 8 + 16 + 1 + 32;
}

impl Ticket {
    pub const LEN: usize = 32 + 32;
}

#[error_code]
pub enum RaffleError {
    #[msg("Raffle Has Ended")]
    RaffleEnded,
    #[msg("Input Error")]
    InputError,
    #[msg("Unauthorized")]
    Unauthorized,
}

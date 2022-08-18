import { BN, Program } from "@project-serum/anchor";
import { SolanaRaffles } from '../context/solana_raffles';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAtaForMint } from "./accounts";

export const createRaffle = async (
    program: Program<SolanaRaffles>,
    fee: number,
    title: string,
    description: string,
    ends: number,
    authority: PublicKey,
    raffle: PublicKey,
    image: string,
    winners: number,
    mint: PublicKey
) => {

    const ticket_price = new BN(fee);
    const ends_at = new BN(ends)

    return await program.methods
    .createRaffle(
        ticket_price,
        ends_at,
        title,
        description,
        image,
        winners <= 0 ? 1 : winners,
        0, // requiures authority
    ) 
    .accounts({
        raffle: raffle,
        authority: authority,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint: mint,

    })
    .instruction();
}

export const closeRaffle = async (
    program: Program<SolanaRaffles>,
    authority: PublicKey,
    raffle: PublicKey
) => {
    return await program.methods
    .endRaffle()
    .accounts({
        raffle: raffle,
        authority: authority
    })
    .instruction();
}

export const purchaseTicket = async (
    program: Program<SolanaRaffles>,
    authority: PublicKey,
    participant: PublicKey,
    raffle: PublicKey,
    ticket: PublicKey,
    mint: PublicKey
) => {

    const [participantAta, _1] = await  getAtaForMint(participant, mint);
    const [authorityAta, _2] = await getAtaForMint(authority, mint);

    return await program.methods
    .purchaseTicket()
    .accounts({
        authority: authority,
        participant: participant,
        raffle: raffle,
        ticket: ticket,
        systemProgram: SystemProgram.programId,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,

        participantAta: participantAta,
        authorityAta: authorityAta
    })
    .instruction();
}
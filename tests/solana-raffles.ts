import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolanaRaffles, IDL } from "../target/types/solana_raffles";
import { airdrop, getAtaForMint, getRawTokenAccount, log, mintNFT } from "./utils";
import idl from '../target/idl/solana_raffles.json';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";

const programId = '4ZEPy6oo8oHzbU6bkiY2m8pLb7aNzyzZaMpAZ6CeZQQf'

describe("solana-raffles", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program =  new Program<SolanaRaffles>(IDL, new anchor.web3.PublicKey(programId));

  let authority = anchor.web3.Keypair.generate();
  let participant = anchor.web3.Keypair.generate();

  let tokenMint: PublicKey = null;
  let participantMintAta: PublicKey = null;

  before("initialize client", async () => {
    await airdrop(authority.publicKey, program.provider.connection);
    await airdrop(participant.publicKey, program.provider.connection);

    log(
      `
    Authority: ${authority.publicKey.toString()}
    Participant: ${participant.publicKey.toString()}
    `,
      "blue"
    );

    const token = await mintNFT(
      program.provider,
      participant,
      participant,
      participant,
      10000
    );

    tokenMint = token.tokenMint;
    participantMintAta = token.payerAta;

  });

  it("create raffle", async () => {
    let raffle = anchor.web3.Keypair.generate();

    let ticket_price = new anchor.BN(1000);
    let ends = new anchor.BN(Date.now() / 1000 + 5); // ends in 5 seconds
    
    let title = 'Okay Bears Giveaway 🎉';
    let description = 'Giving away 1 okay bears, join our discord to enter.';
    let image = 'https://i.ibb.co/w04Prt6/c1f64245afb2.gif';

    let winners = 1;

    const instruction = await program.methods
      .createRaffle(
        ticket_price,
        ends,
        title,
        description,
        image,
        winners,
        0
      )
      .accounts({
        raffle: raffle.publicKey,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint: tokenMint
      })
      .instruction();

    const transaction = new anchor.web3.Transaction();
    transaction.add(instruction);

    const tx = await program.provider.sendAndConfirm(transaction, [
      authority,
      raffle,
    ]);

    log(
      `
    Created Raffle
    Signature: ${tx}
    Raffle ID: ${raffle.publicKey.toString()}
    `,
      "blue"
    );
  });

  it("purchase ticket", async () => {
    let ticket = anchor.web3.Keypair.generate();
    let raffle = (await program.account.raffle.all())[0];

    const [authAta, _1] = await getAtaForMint(authority.publicKey, tokenMint);
    const [partAta, _2] = await getAtaForMint(participant.publicKey, tokenMint);

    const instruction = await program.methods
      .purchaseTicket()
      .accounts({
        raffle: raffle.publicKey,
        ticket: ticket.publicKey,
        participant: participant.publicKey,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMint: tokenMint,
        authorityAta: authAta,
        participantAta: partAta,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction();

    const transaction = new anchor.web3.Transaction();
    transaction.add(instruction);


    const tx = await program.provider.sendAndConfirm(transaction, [
      ticket,
      participant,
    ]);

    log(
      `
    Created Ticket
    Signature: ${tx}
    Ticket ID: ${ticket.publicKey.toString()}
    Participant Balance: ${(await getRawTokenAccount(program.provider, partAta)).amount.toString()}
    Manager Balance: ${(await getRawTokenAccount(program.provider, authAta)).amount.toString()}
    `,
      "blue"
    );
  });

  it("delete raffle", async () => {
    let raffle = (await program.account.raffle.all())[0];
    let ticket = (await program.account.ticket.all())[0];

    log(
      `
    Winner: ${ticket.account.participant.toString()}
    Raffle ID: ${raffle.publicKey.toString()}
    `,
      "blue"
    );

    const instruction = await program.methods
      .endRaffle()
      .accounts({
        raffle: raffle.publicKey,
        authority: authority.publicKey,
      })
      .instruction();

    const transaction = new anchor.web3.Transaction();
    transaction.add(instruction);

    const tx = await program.provider.sendAndConfirm(transaction, [authority]);

    log(
      `
    Deleted Raffle
    Signature: ${tx}
    Raffle ID: ${raffle.publicKey.toString()}
    `,
      "blue"
    );
  });
});

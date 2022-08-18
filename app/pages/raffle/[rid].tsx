import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { ContractContext } from "../../src/context/contract";
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { closeRaffle, purchaseTicket } from "../../src/utils/instructions";
import styles from "../../styles/raffle.module.scss";
import toast from "react-hot-toast";
import Countdown from "react-countdown";
import Loading from "../../src/components/loading";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Head from "next/head";
import {
  getPriceWithDecimal,
  getTokenInfo,
  TokenDataType,
} from "../../src/utils/tokeninfo";

type LocalRaffleInformation = {
  purchasedTickets: number;
  setAt: number;
};

type RaffleType = {
  authority: PublicKey;
  title: string;
  description: string;
  ends: number;
  image: string;
  winners: number;
  token: PublicKey;
  price: number;
};

const Raffle: NextPage = () => {
  const program = useContext(ContractContext);
  const wallet = useAnchorWallet();
  const router = useRouter();

  const { rid } = router.query;

  const [data, setData] = useState<RaffleType | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const [waiting, setWaiting] = useState<boolean>(false);

  const [selectedTickets, setSelectedTickets] = useState<number>(1);
  const [purchasedTickets, setPurchasedTickets] = useState<number>(0);

  const [drawn, setDrawn] = useState<boolean>(false);
  const [winners, setWinners] = useState<JSX.Element[]>();

  const [tokenInfo, setTokenInfo] = useState<TokenDataType | null>(null);

  useEffect(() => {
    if (!data) return;
    const x = async () => {
      const tokenInfo = await getTokenInfo(data.token);
      setTokenInfo(tokenInfo);
    };
    x();
  }, [data]);

  const getAndSetRaffle = async () => {
    if (!program || !rid) return;
    try {
      const raffle = await program.program.account.raffle.fetch(
        new PublicKey(rid)
      );
      setData({
        authority: raffle.authority,
        title: raffle.title,
        description: raffle.description,
        ends: raffle.ends.toNumber(),
        image: raffle.image,
        winners: Number(raffle.winners),
        token: raffle.token,
        price: raffle.price.toNumber(),
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const getAndSetPurchasedTickets = async () => {
    if (!program || !rid || !wallet) return;
    const allTickets = await program.program.account.ticket.all();
    const onChain = allTickets.filter(
      (ticket) =>
        ticket.account.raffle.toString() == rid &&
        ticket.account.participant.toString() == wallet.publicKey.toString()
    ).length;
    const data = JSON.stringify({
      rid: rid,
      owner: wallet.publicKey.toString(),
    });
    const local = window.localStorage.getItem(data);
    if (!local) return setPurchasedTickets(onChain);
    const localData: LocalRaffleInformation = JSON.parse(local);
    if (Date.now() - localData.setAt > 60000)
      return setPurchasedTickets(onChain);
    setPurchasedTickets(localData.purchasedTickets);
  };

  const handleDraw = async () => {
    if (!program || !wallet || !rid || !data) return;
    setDrawn(false);
    const tickets = (await program.program.account.ticket.all())
      .filter((ticket) => ticket.account.raffle.toString() == rid)
      .sort(() => Math.random() - Math.random())
      .slice(0, data.winners <= 0 ? 1 : data.winners);

    if (tickets.length == 0) return alert("No entries");
    setWinners(
      tickets.map((ticket) => (
        <div className={styles.winner} key={ticket.publicKey.toString()}>
          {ticket.account.participant.toString()}
        </div>
      ))
    );
    setDrawn(true);
  };

  const handlePurchaseTickets = async (amount: number) => {
    setWaiting(true);
    if (amount == 0) return alert("Please select at least one ticket");
    if (amount > 25) return alert("Maximum of 25 tickets per transaction");
    try {
      if (!program) return console.log("No Program");
      if (!wallet) return console.log("No wallet connected");
      if (!data) return console.log("Raffle data not loaded");
      if (!rid) return console.log("Raffle does not exist");

      const blockhash = await program.connection.getLatestBlockhash(
        "finalized"
      );

      const transaction = new Transaction({
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        blockhash: blockhash.blockhash,
        feePayer: wallet.publicKey,
      });

      let ticket = Keypair.generate();
      let instruction = await purchaseTicket(
        program.program,
        data.authority,
        wallet.publicKey,
        new PublicKey(rid),
        ticket.publicKey,
        data.token
      );
      transaction.add(instruction);
      transaction.sign(ticket);

      const signed = await wallet.signTransaction(transaction);

      const signature = await program.connection.sendRawTransaction(
        signed.serialize()
      );

      await program.connection.confirmTransaction(
        {
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
          signature: signature,
        },
        "processed"
      );

      setPurchasedTickets(purchasedTickets + amount);
      setSelectedTickets(1);

      window.localStorage.setItem(
        JSON.stringify({
          rid: rid,
          owner: wallet.publicKey.toString(),
        }),
        JSON.stringify({
          purchasedTickets: purchasedTickets + amount,
          setAt: Date.now(),
        })
      );

      toast.success("Purchased Ticket");

      setWaiting(false);
    } catch (err: any) {
      toast.error("Error purchasing ticket");
      setWaiting(false);
      console.log("Error sending transaction");
      console.log(err);
    }
  };

  const handleClose = async () => {
    setWaiting(true);
    try {
      if (!program) return console.log("No Program");
      if (loading) return console.log("Currently Loading");
      if (!wallet) return console.log("Must be connected");
      if (!rid) return console.log("Invalid RID");

      const instruction = await closeRaffle(
        program.program,
        wallet.publicKey,
        new PublicKey(rid)
      );

      const blockhash = await program.connection.getLatestBlockhash(
        "finalized"
      );

      const transaction = new Transaction({
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        blockhash: blockhash.blockhash,
        feePayer: wallet.publicKey,
      });

      transaction.add(instruction);
      const signed = await wallet.signTransaction(transaction);
      const signature = await program.connection.sendRawTransaction(
        signed.serialize()
      );

      await program.connection.confirmTransaction({
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        signature: signature,
      });

      toast.success("Closed Raffle");
      setWaiting(false);
      setData(null);
    } catch (err: any) {
      toast.error("Error Closing Raffle");
      setWaiting(false);
      console.log("Error sending transaction");
      console.log(err);
    }
  };

  useEffect(() => {
    getAndSetRaffle();
    getAndSetPurchasedTickets();
  }, [program]);

  return loading ? (
    <h2>Loading...</h2>
  ) : data ? (
    <div className={styles.container}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:image" content={data.image} key="ogimg"></meta>

        <meta property="og:title" content={data.title} key="ogtitle" />
        <meta
          property="og:description"
          content={data.description}
          key="ogdesc"
        />
      </Head>

      <Loading loading={waiting} />

      <div className={styles.title}>
        <h1>
          <CopyToClipboard text={window.location.href}>
            <img
              src={"/link.svg"}
              onClick={() => toast.success("Copied to Clipboard")}
            />
          </CopyToClipboard>
          {data.title}
        </h1>
        &nbsp; | &nbsp;
        <span>
          {/* @ts-ignore */}
          <Countdown date={data.ends * 1000} />
        </span>
        {data.authority &&
          wallet &&
          data.authority.toString() == wallet.publicKey.toString() && (
            <div className={styles.tools}>
              <button onClick={() => handleDraw()}>Draw Raffle</button>
              <button className="button_danger" onClick={() => handleClose()}>
                Close Raffle
              </button>
            </div>
          )}
        <p>
          <b>Creator:</b> &nbsp;
          <i>
            {data.authority.toString().substring(0, 3) +
              "..." +
              data.authority
                .toString()
                .substring(data.authority.toString().length - 3)}
          </i>
        </p>
      </div>

      <hr />

      <div className={styles.content}>
        {data.authority &&
          wallet &&
          data.authority.toString() == wallet.publicKey.toString() && (
            <div className={`${styles.draw} ${drawn && styles.full}`}>
              <h3>Drawed Winner/s: </h3>
              {winners && winners}
              <hr />
            </div>
          )}
        <div
          className={`${styles.actions} ${
            Date.now() / 1000 > data.ends && styles.disabled
          }`}
        >
          <h2>Purchase Tickets</h2>
          <p>
            Ticket Price: &nbsp;{" "}
            <b>
              {tokenInfo ? (
                <>
                  {getPriceWithDecimal(tokenInfo, data.price)}
                  &nbsp; ${tokenInfo.symbol}
                </>
              ) : (
                0
              )}
            </b>
          </p>
          <p>
            Current Tickets: &nbsp; <b>{purchasedTickets}</b>
          </p>
          <div className={styles.selector}>
            <button
              disabled
              onClick={() => {
                setSelectedTickets(selectedTickets - 1);
              }}
            >
              −
            </button>
            <h3>{selectedTickets.toString()}</h3>

            <button
              disabled
              onClick={() => {
                setSelectedTickets(selectedTickets + 1);
              }}
            >
              +
            </button>
          </div>
          <button
            style={{ width: "100%" }}
            onClick={() => handlePurchaseTickets(selectedTickets)}
          >
            Purchase Tickets
          </button>
        </div>

        <div className={styles.image}>
          <img src={data.image} width="100%" />
        </div>

        <hr style={{ opacity: ".2", borderWidth: "5px" }} />

        <div className={styles.description}>
          <h2>About: </h2>
          <p>{data.description}</p>
        </div>
      </div>
    </div>
  ) : (
    <h1>404 - Raffle does not exist.</h1>
  );
};

export default Raffle;

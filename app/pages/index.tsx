import { BN, ProgramAccount } from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";
import Raffle from "../src/components/raffle/raffle";
import { ContractContext } from "../src/context/contract";
import styles from "../styles/home.module.scss";

const Home: NextPage = () => {
  const [raffles, setRaffles] = useState<JSX.Element[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const program = useContext(ContractContext);

  const fetchRaffles = async () => {
    if (!program) return;
    const data = await program.program.account.raffle.all();
    await new Promise((r) => setTimeout(r, 2000));
    console.log("Accounts: ", data);
    setRaffles(
      data.map((account) => (
        <Raffle
          key={account.publicKey.toString()}
          account={{
            author: account.account.authority,
            title: account.account.title,
            description: account.account.description,
            fee: 0,
            ends: account.account.ends.toNumber(),
            image: account.account.image,
          }}
          publicKey={account.publicKey}
        />
      ))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchRaffles();
  }, [program]);

  return (
    <div className={styles.container}>

      <Head>
        <meta property="og:title" content={'DAOify Raffles'} key="ogtitle" />
        <meta property="og:description" content={'Create & Participate in raffles on Solana, brought to you by DAOify'} key="ogdesc" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
      </Head>
      <div className={styles.disclaimer}>
        <h3>Disclaimer</h3>
        <p>
          DAOify is providing a service to host raffles, we do not
          endorse any raffles hosted on this site - please use discretion when
          participating.
        </p>
      </div>

      <hr style={{ margin: "50px 0" }} />

      {loading ? (
        <div className={styles.loading}>
          {" "}
          <ScaleLoader color="white" loading={loading} />
        </div>
      ) : (
        raffles && raffles
      )}
    </div>
  );
};

export default Home;

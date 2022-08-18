import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC } from "react";
import styles from "./menu.module.scss";

const links = [
  {
    name: "Raffles",
    value: "/"
  },
  {
    name: "Create",
    value: "/create"
  }
]

export const Menu: FC = () => {
  const router = useRouter();
  return (
    <div className={styles.container}>
      {/* <img src={"/logo.svg"}/> <i>&nbsp;Raffles</i> */}
      <Link href='/'><h1>DAOify Raffles</h1></Link>
   
   <div className={styles.wallet_button}>
     <WalletMultiButton />
   </div>
      
      <div className={styles.links}>
        {links.map((link) => (
          <div className={styles.link} onClick={() => router.push(link.value.toString())} key={link.value}>
            {link.name}
          </div>
        ))}
      </div>
    </div>
  );
};

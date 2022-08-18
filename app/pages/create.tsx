import { useAnchorWallet } from "@solana/wallet-adapter-react";
import type { NextPage } from "next";
import { useContext, useEffect, useState } from "react";
import { ContractContext } from "../src/context/contract";
import { createRaffle } from "../src/utils/instructions";
import styles from "../styles/create.module.scss";
import { Keypair, Transaction, PublicKey } from "@solana/web3.js";
import ImageUploader from "../src/components/ImageUploader";
import Loading from "../src/components/loading";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Popup from "../src/components/popup";
import Head from "next/head";
import { getFeeWithDecimal, getPriceWithDecimal, getTokenInfo } from "../src/utils/tokeninfo";


const Create: NextPage = () => {

  const [loading, setLoading] = useState<boolean>(false);

  const [customToken, setCustomToken] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [fee, setFee] = useState<string>('');
  const [winners, setWinners] = useState<number>(1);
  const [image, setImage] = useState<string>('');

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  const wallet = useAnchorWallet();
  const program = useContext(ContractContext);
  const router = useRouter();

  const uploadImage = async (image_data: string): Promise<string> => {
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          image: image_data
        })
      });
      return await response.json();
    } catch {
      toast.error('Image Too Large');
      throw new Error('Image too large');
    }
  }

  const getEndFromDates = (date: Date, time: Date): {ends: number; now: number;} => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getUTCDate();

    const hours = time.getUTCHours();
    const minutes = time.getUTCMinutes();

    const ends = Number(new Date(`${year}-${month + 1}-${day} ${hours}:${minutes}:00`)) / 1000;
    const now = Number(new Date(Date.now())) / 1000;
    return { now, ends };
  }

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (!program) return console.log('No Program');
      if (!wallet) return console.log('No wallet connected');


      if(!customToken) {
        toast.error('SOL is currently unsupported');
        setLoading(false);
        return;
      }

      if(!time) {
        toast.error('No End Time Selected');
        setLoading(false);
        return;
      }
      if(!date) {
        toast.error('No End Date Selected');
        setLoading(false);
        return;
      }
      if(title == '') {
        toast.error('Title Empty');
        setLoading(false);
        return;
      };

      if(description == '') {
        toast.error('Description Empty');
        setLoading(false);
        return;
      };

      if(!token) {
        toast.error('No Token Selected');
        setLoading(false);
        return;
      };

      const { now, ends } = getEndFromDates(date, time);

      if(now > ends) {
        toast.error('End Date Can\'t Be In The Past');
        setLoading(false);
        return;
      }

      const tokenInfo = await getTokenInfo(new PublicKey(token));
      const entry_fee = getFeeWithDecimal(tokenInfo, parseFloat(fee));

      // const image_url: string = image == '' ? 'https://i.ibb.co/whcrbrJ/blank.png' : await uploadImage(image);
      const image_url: string =  'https://i.ibb.co/whcrbrJ/blank.png';

      const raffle = Keypair.generate();
      const instruction = await createRaffle(
        program.program,
        entry_fee,
        title,
        description,
        ends,
        wallet.publicKey,
        raffle.publicKey,
        image_url,
        winners,
        new PublicKey(token)
      );

      const blockhash = await program.connection.getLatestBlockhash('finalized');

      const transaction = new Transaction({
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        blockhash: blockhash.blockhash,
        feePayer: wallet.publicKey
      });
      
      transaction.add(instruction);
      transaction.sign(raffle);

      const signed = await wallet.signTransaction(transaction);
      const signature = await program.connection.sendRawTransaction(signed.serialize());

      await program.connection.confirmTransaction({
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight,
        signature: signature
      }, 'max');


      toast.success('Raffle Created');
      router.push(`/raffle/${raffle.publicKey.toString()}`);

    } catch (err: any) {
      toast.error('Error Creating Raffle');
      setLoading(false);
      console.log("Error sending transaction");
      console.log(err);
    }
  };


  const [selectTokenModalOpen, setSelectTokenModalOpen] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string>('');

  return (
    <div className={styles.container}>

      <Head>
      <meta property="og:title" content={'Create Raffle | DAOify Raffles'} key="ogtitle" />
        <meta property="og:description" content={'Create your own raffle on Solana'} key="ogdesc" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Popup
        title={'SELECT CUSTOM TOKEN'}
        open={selectTokenModalOpen}
        setOpen={setSelectTokenModalOpen}
      >
        <>
        <label>Token Address</label>
          <input
            type='text'
            placeholder="eg. LUSTdLASZy86pR6V5VjMpXxW9oVtCQt8q3fJ9iHZtPY"
            value={tempToken}
            onChange={(e) => setTempToken(e.target.value)}
          />
        <button onClick={() => {
          if(tempToken.length < 30) return toast.error('Invalid Token');
          setToken(tempToken);
          setTempToken('');
          toast.success('Token Added');
          setSelectTokenModalOpen(false);
        
        }}>
          SUBMIT
        </button>
        </>
      </Popup>

      <Loading loading={loading}/>
      <h2>Create a Raffle</h2>
      <div className={styles.form}>
  
        <label>
          Title:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Whitelist Raffle" />
        </label>
        <label>
          Description:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Raffle to win an awesome whitelist!" />
        </label>
        <label>
          End Date:
          <input type="date" onChange={(e) => setDate(e.target.valueAsDate)}/>
        </label>
        <label>
          End Time UTC:
          <input type="time" onChange={(e) => setTime(e.target.valueAsDate)} />
        </label>
        <label>
          Entry Fee:
          &nbsp;

          <button style={{display:'none'}}/>

          <button onClick={() => setCustomToken(false)}  className={`${!customToken && 'selected'}`}>SOL</button>
          <button onClick={() => { setCustomToken(true); setSelectTokenModalOpen(true)}}  className={`${customToken && 'selected'}`}>Custom Token</button>


          {customToken &&(
            <span>
              &nbsp;
              {token.substring(0, 5) + "..." + token.substring(token.length - 5)}
            </span>
          )
          }

          <input type="number" min={0} placeholder="0.0" value={fee} onChange={(e) => setFee(e.target.value)}/>

        </label>

        <label>
          Amount of Winners:
          <input type="number" placeholder="1" value={winners} onChange={(e) => setWinners(e.target.valueAsNumber)} />
        </label>
        <label>
          Image:
        </label>
        <ImageUploader setImage={setImage}/>

      <input type="submit" value="Create Raffle" onClick={handleCreate}/>

        </div>
  
    </div>
  );
};

export default Create;

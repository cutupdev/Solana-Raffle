import { getMint } from "@solana/spl-token"
import { PublicKey, Connection } from '@solana/web3.js';
import axios from "axios";


export type TokenDataType = {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI: string;
    extensions: any;
}


export const getTokenInfo = async (
    token: PublicKey
): Promise<TokenDataType> => {
    const data: any = (await axios.get('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')).data.tokens;
    const tokenData = data.filter((tokenData: any) => tokenData.address == token.toString());
    return tokenData[0];
}

export const getPriceWithDecimal = (
    tokenData: TokenDataType,
    price: number
): number => {
    return price / Math.pow(10, tokenData.decimals);
}

export const getFeeWithDecimal = (
    tokenData: TokenDataType,
    price: number
): number => {
    return price * Math.pow(10, tokenData.decimals);
}

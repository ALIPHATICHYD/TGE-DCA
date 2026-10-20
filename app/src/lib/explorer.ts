import { NETWORK } from './config';

export const explorerTx = (digest: string) => `https://suiscan.xyz/${NETWORK}/tx/${digest}`;
export const explorerObject = (id: string) => `https://suiscan.xyz/${NETWORK}/object/${id}`;

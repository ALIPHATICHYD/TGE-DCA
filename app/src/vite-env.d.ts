/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PACKAGE_ID?: string;
  readonly VITE_SUI_NETWORK?: 'devnet' | 'testnet' | 'mainnet';
  readonly VITE_DEEPBOOK_NETWORK?: 'testnet' | 'mainnet';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

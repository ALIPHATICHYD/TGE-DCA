/// <reference types="vite/client" />

interface ImportMetaEnv {
  SUI_NETWORK: string;
  TGE_PACKAGE_ID: string;
  readonly VITE_SUI_NETWORK: string;
  readonly VITE_PACKAGE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

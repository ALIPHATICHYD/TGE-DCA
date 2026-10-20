type Network = 'devnet' | 'testnet' | 'mainnet';

const env = import.meta.env;

/** Published `tge_dca` package. Only `VITE_`-prefixed vars reach the browser. */
export const PACKAGE_ID: string = env.VITE_PACKAGE_ID || '0x0';
export const IS_CONFIGURED = PACKAGE_ID !== '0x0';

export const NETWORK = ((env.VITE_SUI_NETWORK as Network) || 'testnet') as Network;

/** DeepBook v3 only exists on testnet and mainnet. */
export const DEEPBOOK_NETWORK: 'testnet' | 'mainnet' =
  env.VITE_DEEPBOOK_NETWORK === 'mainnet' || (!env.VITE_DEEPBOOK_NETWORK && NETWORK === 'mainnet')
    ? 'mainnet'
    : 'testnet';

export const CLOCK_OBJECT_ID = '0x6';
export const SUI_TYPE = '0x2::sui::SUI';
export const MODULE = `${PACKAGE_ID}::dca`;

/** SUI kept back for gas when depositing "max". */
export const GAS_BUFFER_SUI = 0.01;

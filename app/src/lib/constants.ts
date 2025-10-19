export const PACKAGE_ID = import.meta.env.TGE_PACKAGE_ID || '';
export const NETWORK = import.meta.env.SUI_NETWORK || 'testnet';

export const CLOCK_OBJECT_ID = '0x6';

export const FREQUENCY_OPTIONS = [
  { label: 'Daily', value: 1, ms: 86400000 },
  { label: 'Weekly', value: 7, ms: 604800000 },
  { label: 'Bi-Weekly', value: 14, ms: 1209600000 },
  { label: 'Monthly', value: 30, ms: 2592000000 },
];

export const TARGET_ASSETS = ['SUI', 'USDC', 'USDT', 'WETH'];

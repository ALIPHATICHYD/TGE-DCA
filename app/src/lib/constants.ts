export { PACKAGE_ID, NETWORK, CLOCK_OBJECT_ID } from './config';

const DAY = 86_400_000;

export const FREQUENCY_OPTIONS = [
  { label: 'Day', days: 1, ms: DAY },
  { label: 'Week', days: 7, ms: 7 * DAY },
  { label: '2 weeks', days: 14, ms: 14 * DAY },
  { label: 'Month', days: 30, ms: 30 * DAY },
];

/** Deposits are SUI, so SUI is not a buy target. */
export const TARGET_ASSETS = [
  { symbol: 'USDC', note: 'DeepBook · SUI/USDC pool' },
  { symbol: 'USDT', note: 'DeepBook · routed via USDC on testnet' },
];

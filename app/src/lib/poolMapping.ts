/**
 * DeepBook Pool Mapping
 * Maps target assets to available DeepBook pools based on network
 */

export type PoolKey = string;

// Available pools on testnet
const TESTNET_POOLS: Record<string, PoolKey> = {
  'USDC': 'SUI_DBUSDC',
  'USDT': 'SUI_DBUSDC', // Fallback: USDT trades via USDC pool on testnet
  'WETH': 'SUI_DBUSDC', // Fallback: WETH trades via USDC pool on testnet
  'SUI': 'SUI_DBUSDC',
};

// Available pools on mainnet
const MAINNET_POOLS: Record<string, PoolKey> = {
  'USDC': 'SUI_USDC',
  'USDT': 'SUI_USDT',
  'WETH': 'WETH_USDC', // or another available pair
  'SUI': 'SUI_USDC',
};

/**
 * Get the correct pool key for a target asset
 * @param targetAsset - The target asset (e.g., 'USDC', 'USDT', 'WETH')
 * @param network - Network ('testnet' or 'mainnet')
 * @returns Pool key for DeepBook queries
 */
export function getPoolKey(targetAsset: string, network: 'testnet' | 'mainnet' = 'testnet'): PoolKey {
  const poolMap = network === 'mainnet' ? MAINNET_POOLS : TESTNET_POOLS;
  return poolMap[targetAsset] || poolMap['USDC']; // Default to USDC pool
}

/**
 * Get the actual output token for display
 * (on testnet, USDT and WETH orders go through USDC pool)
 * @param targetAsset - Requested target asset
 * @param network - Network
 * @returns Display token name
 */
export function getDisplayToken(targetAsset: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  if (network === 'testnet') {
    // On testnet, all convert to USDC
    if (targetAsset === 'USDT' || targetAsset === 'WETH') {
      return 'USDC'; // Fallback display token
    }
  }
  return targetAsset;
}

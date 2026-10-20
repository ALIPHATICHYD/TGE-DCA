/**
 * DeepBook v3 Price & Swap Utilities
 * Handles price fetching and swap calculations.
 *
 * The v3 SDK returns `midPrice(pool) -> number` and
 * `getLevel2TicksFromMid(pool, ticks) -> { bid_prices, bid_quantities, ask_prices, ask_quantities }`.
 */

export interface Level2Data {
  price: number;
  quantity: number;
  side: 'bid' | 'ask';
}

/**
 * Get current mid price from a DeepBook pool
 * @param poolKey - e.g., 'SUI_DBUSDC' on testnet, 'SUI_USDC' on mainnet
 * @param deepbookClient - Initialized DeepBook client
 */
export async function getCurrentPrice(poolKey: string, deepbookClient: any): Promise<number> {
  if (!deepbookClient) {
    throw new Error('DeepBook client not initialized');
  }
  const mid = Number(await deepbookClient.midPrice(poolKey));
  if (!Number.isFinite(mid) || mid <= 0) {
    throw new Error(`No mid price for pool ${poolKey}`);
  }
  return mid;
}

/**
 * Get expected output amount for a given input
 * @param inputAmount - Amount to swap in smallest units (MIST)
 * @param poolKey - Pool identifier (e.g., 'SUI_USDC')
 * @param deepbookClient - Initialized DeepBook client
 */
export async function getExpectedOutput(
  inputAmount: number,
  poolKey: string,
  deepbookClient: any
): Promise<number> {
  if (inputAmount <= 0) {
    throw new Error('Input amount must be positive');
  }
  const price = await getCurrentPrice(poolKey, deepbookClient);
  // Simple calculation: amount * price. Fees and slippage are applied by the caller.
  return Math.floor(inputAmount * price);
}

/**
 * Get the best bid and ask levels around the mid price
 * @param levels - Number of levels per side
 */
export async function getPriceLevels(
  poolKey: string,
  deepbookClient: any,
  levels: number = 5
): Promise<{ bids: Level2Data[]; asks: Level2Data[] }> {
  try {
    if (!deepbookClient) {
      throw new Error('DeepBook client not initialized');
    }
    const book = await deepbookClient.getLevel2TicksFromMid(poolKey, levels);
    const side = (prices: number[] = [], quantities: number[] = [], s: 'bid' | 'ask') =>
      prices.map((price, i) => ({ price, quantity: quantities[i] ?? 0, side: s }));

    const bids = side(book?.bid_prices, book?.bid_quantities, 'bid')
      .sort((a, b) => b.price - a.price)
      .slice(0, levels);
    const asks = side(book?.ask_prices, book?.ask_quantities, 'ask')
      .sort((a, b) => a.price - b.price)
      .slice(0, levels);
    return { bids, asks };
  } catch (error) {
    console.error('Error fetching price levels:', error);
    return { bids: [], asks: [] };
  }
}

/**
 * Check if the ask side has enough base quantity near the mid for a trade
 * @param amount - Amount to trade, in base units
 */
export async function checkLiquidity(
  amount: number,
  poolKey: string,
  deepbookClient: any
): Promise<boolean> {
  const { bids, asks } = await getPriceLevels(poolKey, deepbookClient, 20);
  const total = [...bids, ...asks].reduce((sum, l) => sum + l.quantity, 0);
  return total >= amount;
}

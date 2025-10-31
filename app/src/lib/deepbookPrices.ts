/**
 * DeepBook v3 Price & Swap Utilities
 * Handles price fetching and swap calculations
 */

interface Level2Data {
  price: number;
  quantity: number;
  side: 'bid' | 'ask';
}

/**
 * Get current price from DeepBook pool
 * @param poolKey - e.g., 'SUI_DBUSDC' on testnet, 'SUI_USDC' on mainnet
 * @param deepbookClient - Initialized DeepBook client
 * @returns Mid price of the pool
 */
export async function getCurrentPrice(
  poolKey: string,
  deepbookClient: any
): Promise<number> {
  try {
    // Get level 2 order book data
    const level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0, // Start price
      1000, // End price
      true // Include bids
    );

    if (!level2Data || level2Data.length === 0) {
      throw new Error(`No price data available for pool: ${poolKey}`);
    }

    // Separate bids and asks
    const bids = level2Data.filter((item: Level2Data) => item.side === 'bid');
    const asks = level2Data.filter((item: Level2Data) => item.side === 'ask');

    if (bids.length === 0 || asks.length === 0) {
      throw new Error(`Insufficient liquidity in pool: ${poolKey}`);
    }

    // Get best bid and ask
    const bestBid = Math.max(...bids.map((b: Level2Data) => b.price));
    const bestAsk = Math.min(...asks.map((a: Level2Data) => a.price));

    // Calculate mid price
    const midPrice = (bestBid + bestAsk) / 2;

    if (isNaN(midPrice) || midPrice <= 0) {
      throw new Error('Invalid price calculated');
    }

    return midPrice;
  } catch (error) {
    console.error(`Error fetching price for ${poolKey}:`, error);
    throw error;
  }
}

/**
 * Get expected output amount for a given input
 * @param inputAmount - Amount to swap in smallest units (MIST)
 * @param poolKey - Pool identifier (e.g., 'SUI_USDC')
 * @param deepbookClient - Initialized DeepBook client
 * @returns Expected output amount
 */
export async function getExpectedOutput(
  inputAmount: number,
  poolKey: string,
  deepbookClient: any
): Promise<number> {
  try {
    if (inputAmount <= 0) {
      throw new Error('Input amount must be positive');
    }

    const price = await getCurrentPrice(poolKey, deepbookClient);
    
    // Simple calculation: amount * price
    // In production, account for slippage and fees
    const output = Math.floor(inputAmount * price);

    return output;
  } catch (error) {
    console.error('Error calculating expected output:', error);
    throw error;
  }
}

/**
 * Get multiple price levels from the order book
 * @param poolKey - Pool identifier
 * @param deepbookClient - Initialized DeepBook client
 * @param levels - Number of levels to return
 * @returns Object with bid and ask levels
 */
export async function getPriceLevels(
  poolKey: string,
  deepbookClient: any,
  levels: number = 5
) {
  try {
    const level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0,
      1000,
      true
    );

    const bids = level2Data
      .filter((item: Level2Data) => item.side === 'bid')
      .sort((a: Level2Data, b: Level2Data) => b.price - a.price)
      .slice(0, levels);

    const asks = level2Data
      .filter((item: Level2Data) => item.side === 'ask')
      .sort((a: Level2Data, b: Level2Data) => a.price - b.price)
      .slice(0, levels);

    return { bids, asks };
  } catch (error) {
    console.error('Error fetching price levels:', error);
    throw error;
  }
}

/**
 * Check if sufficient liquidity exists for a trade
 * @param amount - Amount to trade
 * @param poolKey - Pool identifier
 * @param deepbookClient - Initialized DeepBook client
 * @returns Boolean indicating if liquidity is sufficient
 */
export async function checkLiquidity(
  amount: number,
  poolKey: string,
  deepbookClient: any
): Promise<boolean> {
  try {
    const level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0,
      1000,
      true
    );

    const totalLiquidity = level2Data.reduce(
      (sum: number, item: Level2Data) => sum + item.quantity,
      0
    );

    return totalLiquidity >= amount;
  } catch (error) {
    console.error('Error checking liquidity:', error);
    return false;
  }
}

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
    if (!deepbookClient) {
      throw new Error('DeepBook client not initialized');
    }

    // Get level 2 order book data
    let level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0, // Start price
      1000, // End price
      true // Include bids
    );

    // Ensure level2Data is an array
    if (!Array.isArray(level2Data)) {
      if (level2Data?.data && Array.isArray(level2Data.data)) {
        level2Data = level2Data.data;
      } else {
        // Still not an array, return error
        throw new Error(`Invalid price data format for pool: ${poolKey}. Expected array.`);
      }
    }

    // Extra safety check
    if (!level2Data || level2Data.length === 0) {
      throw new Error(`No price data available for pool: ${poolKey}`);
    }

    // Separate bids and asks - with extra null checks
    const bids = level2Data.filter((item: any) => item && item.side === 'bid');
    const asks = level2Data.filter((item: any) => item && item.side === 'ask');

    if (bids.length === 0 || asks.length === 0) {
      throw new Error(`Insufficient liquidity in pool: ${poolKey}. Bids: ${bids.length}, Asks: ${asks.length}`);
    }

    // Get best bid and ask - with null safety
    const bidPrices = bids
      .map((b: any) => b?.price)
      .filter((p: any) => typeof p === 'number' && !isNaN(p));
    const askPrices = asks
      .map((a: any) => a?.price)
      .filter((p: any) => typeof p === 'number' && !isNaN(p));

    if (bidPrices.length === 0 || askPrices.length === 0) {
      throw new Error('No valid prices in order book');
    }

    const bestBid = Math.max(...bidPrices);
    const bestAsk = Math.min(...askPrices);

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
    if (!deepbookClient) {
      throw new Error('DeepBook client not initialized');
    }

    let level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0,
      1000,
      true
    );

    // Normalize response
    if (!Array.isArray(level2Data)) {
      if (level2Data?.data && Array.isArray(level2Data.data)) {
        level2Data = level2Data.data;
      } else {
        return { bids: [], asks: [] };
      }
    }

    const bids = level2Data
      .filter((item: Level2Data) => item?.side === 'bid' && item?.price != null)
      .sort((a: Level2Data, b: Level2Data) => (b?.price ?? 0) - (a?.price ?? 0))
      .slice(0, levels);

    const asks = level2Data
      .filter((item: Level2Data) => item?.side === 'ask' && item?.price != null)
      .sort((a: Level2Data, b: Level2Data) => (a?.price ?? 0) - (b?.price ?? 0))
      .slice(0, levels);

    return { bids, asks };
  } catch (error) {
    console.error('Error fetching price levels:', error);
    return { bids: [], asks: [] };
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
    if (!deepbookClient) {
      return false;
    }

    let level2Data = await deepbookClient.getLevel2Range(
      poolKey,
      0,
      1000,
      true
    );

    // Normalize response
    if (!Array.isArray(level2Data)) {
      if (level2Data?.data && Array.isArray(level2Data.data)) {
        level2Data = level2Data.data;
      } else {
        return false;
      }
    }

    const totalLiquidity = level2Data.reduce(
      (sum: number, item: Level2Data) => sum + (item?.quantity ?? 0),
      0
    );

    return totalLiquidity >= amount;
  } catch (error) {
    console.error('Error checking liquidity:', error);
    return false;
  }
}

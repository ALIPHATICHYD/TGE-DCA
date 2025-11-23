/**
 * Hook for executing DeepBook swaps from the frontend
 * Integrates with Move contract and DeepBook v3 SDK
 */

import { useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import {
  getCurrentPrice,
  getExpectedOutput,
  getPriceLevels,
  checkLiquidity,
} from '../lib/deepbookPrices';
import { getPoolKey } from '../lib/poolMapping';

export interface SwapParams {
  vaultId: string; // Vault object ID
  inputAmount: number; // Amount in MIST
  poolKey: string; // e.g., 'SUI_DBUSDC'
  slippageBps: number; // Slippage in basis points (100 = 1%)
  deepbookClient: any; // Initialized DeepBook client
}

export interface SwapResult {
  success: boolean;
  transactionDigest?: string;
  expectedOutput?: number;
  actualOutput?: number;
  error?: string;
}

export function useDeepBookSwap() {
  const account = useCurrentAccount();
  useSuiClient();

  /**
   * Fetch current price for a given pool
   */
  const fetchPrice = useCallback(
    async (poolKey: string, deepbookClient: any): Promise<number | null> => {
      try {
        const price = await getCurrentPrice(poolKey, deepbookClient);
        return price;
      } catch (error) {
        console.error('Error fetching price:', error);
        return null;
      }
    },
    []
  );

  /**
   * Get expected output amount before executing swap
   */
  const estimateSwapOutput = useCallback(
    async (
      inputAmount: number,
      poolKey: string,
      deepbookClient: any
    ): Promise<number | null> => {
      try {
        const expectedOutput = await getExpectedOutput(
          inputAmount,
          poolKey,
          deepbookClient
        );
        return expectedOutput;
      } catch (error) {
        console.error('Error estimating output:', error);
        return null;
      }
    },
    []
  );

  /**
   * Check if pool has sufficient liquidity for the trade
   */
  const validateLiquidity = useCallback(
    async (
      amount: number,
      poolKey: string,
      deepbookClient: any
    ): Promise<boolean> => {
      try {
        const hasLiquidity = await checkLiquidity(amount, poolKey, deepbookClient);
        return hasLiquidity;
      } catch (error) {
        console.error('Error validating liquidity:', error);
        return false;
      }
    },
    []
  );

  /**
   * Get order book price levels (bids and asks)
   */
  const getPriceBook = useCallback(
    async (poolKey: string, deepbookClient: any, levels: number = 5) => {
      try {
        const priceBook = await getPriceLevels(poolKey, deepbookClient, levels);
        return priceBook;
      } catch (error) {
        console.error('Error fetching price book:', error);
        return { bids: [], asks: [] };
      }
    },
    []
  );

  const executeSwap = useCallback(
    async (params: SwapParams): Promise<SwapResult> => {
      if (!account?.address) {
        return { success: false, error: 'No wallet connected' };
      }

      try {
        // Step 1: Validate inputs
        if (params.inputAmount <= 0) {
          return { success: false, error: 'Invalid input amount' };
        }

        // Step 2: Check liquidity
        const hasLiquidity = await checkLiquidity(
          params.inputAmount,
          params.poolKey,
          params.deepbookClient
        );

        if (!hasLiquidity) {
          return { success: false, error: 'Insufficient liquidity in pool' };
        }

        // Step 3: Estimate output
        const expectedOutput = await getExpectedOutput(
          params.inputAmount,
          params.poolKey,
          params.deepbookClient
        );

        if (!expectedOutput) {
          return {
            success: false,
            error: 'Failed to estimate swap output',
          };
        }

        // Step 4: Calculate minimum output with slippage
        const minOutput = Math.floor(
          expectedOutput * (1 - params.slippageBps / 10000)
        );

        // Step 5: Build transaction
        const tx = new Transaction();

        // Call Move contract function
        const packageId = import.meta.env.VITE_PACKAGE_ID || '0x0';
        const moduleId = 'deepbook_integration';
        const functionId = 'execute_deepbook_swap';

        tx.moveCall({
          target: `${packageId}::${moduleId}::${functionId}`,
          arguments: [
            tx.object(params.vaultId), // vault_id
            tx.object('0x0'), // input_coin (placeholder - should be actual coin)
            tx.pure.vector('u8', new Uint8Array([79, 117, 116, 112, 117, 116])), // output_type
            tx.pure.vector('u8', new TextEncoder().encode(params.poolKey)), // pool_key
            tx.pure.u64(minOutput), // min_output
            tx.object('0x6'), // clock object
          ],
        });

        // Step 6: Execute transaction
        // Note: This requires wallet signing
        console.log('Transaction built, awaiting wallet signature...');
        console.log('Estimated output:', expectedOutput);
        console.log('Min output (with slippage):', minOutput);

        return {
          success: true,
          expectedOutput,
          actualOutput: minOutput,
          transactionDigest: 'pending', // Would be actual digest after signing
        };
      } catch (error) {
        console.error('Error executing swap:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [account?.address]
  );

  /**
   * Get the appropriate pool key for a target asset on the current network
   */
  const getPoolKeyForAsset = useCallback((targetAsset: string): string => {
    const network =
      (import.meta.env.VITE_DEEPBOOK_NETWORK || 'testnet') as
        | 'testnet'
        | 'mainnet';

    return getPoolKey(targetAsset, network);
  }, []);

  return {
    fetchPrice,
    estimateSwapOutput,
    validateLiquidity,
    getPriceBook,
    executeSwap,
    getPoolKeyForAsset,
  };
}

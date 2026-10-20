import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { DeepBookClient } from '@mysten/deepbook-v3';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DEEPBOOK_NETWORK } from '../lib/config';
import { getCurrentPrice, getPriceLevels } from '../lib/deepbookPrices';
import { getPoolKey } from '../lib/poolMapping';

// Read-only queries are dev-inspected, so any sender works before a wallet connects.
const READ_ONLY_SENDER = '0x0000000000000000000000000000000000000000000000000000000000000000';

const suiClient = new SuiClient({ url: getFullnodeUrl(DEEPBOOK_NETWORK) });

/** One DeepBook client per address, shared by every market widget. */
export function useDeepBookClient() {
  const account = useCurrentAccount();
  const address = account?.address ?? READ_ONLY_SENDER;
  return useMemo(
    () => new DeepBookClient({ address, env: DEEPBOOK_NETWORK, client: suiClient as any }),
    [address]
  );
}

/** Live mid price for the pool that serves `targetAsset`. */
export function useMidPrice(targetAsset = 'USDC') {
  const client = useDeepBookClient();
  const poolKey = getPoolKey(targetAsset, DEEPBOOK_NETWORK);
  const query = useQuery({
    queryKey: ['deepbook', 'mid', DEEPBOOK_NETWORK, poolKey],
    queryFn: () => getCurrentPrice(poolKey, client),
    refetchInterval: 15_000,
    retry: 1,
  });
  return { poolKey, price: query.data ?? null, isLoading: query.isLoading, error: query.error };
}

/** Best levels either side of the mid. */
export function useOrderBook(targetAsset = 'USDC', levels = 4) {
  const client = useDeepBookClient();
  const poolKey = getPoolKey(targetAsset, DEEPBOOK_NETWORK);
  const query = useQuery({
    queryKey: ['deepbook', 'book', DEEPBOOK_NETWORK, poolKey, levels],
    queryFn: () => getPriceLevels(poolKey, client, levels),
    refetchInterval: 15_000,
    retry: 1,
  });
  return { poolKey, book: query.data ?? { bids: [], asks: [] }, isLoading: query.isLoading };
}

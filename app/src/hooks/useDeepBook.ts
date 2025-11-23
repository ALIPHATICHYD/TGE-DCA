import { useCallback } from 'react';
import { DeepBookClient } from '@mysten/deepbook-v3';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface DeepBookClients {
  suiClient: SuiClient;
  deepbookClient: DeepBookClient;
}

export function useDeepBook() {
  const account = useCurrentAccount();

  const initializeDeepBook = useCallback((): DeepBookClients | null => {
    if (!account?.address) {
      console.warn('No account connected');
      return null;
    }

    try {
      const network = (import.meta.env.VITE_DEEPBOOK_NETWORK || 'testnet') as 'testnet' | 'mainnet';

      const suiClient = new SuiClient({
        url: getFullnodeUrl(network),
      });

      const deepbookClient = new DeepBookClient({
        address: account.address,
        env: network,
        client: suiClient as unknown as any,
      });

      return {
        suiClient,
        deepbookClient,
      };
    } catch (error) {
      console.error('Error initializing DeepBook:', error);
      return null;
    }
  }, [account?.address]);

  return { initializeDeepBook };
}

import { useMemo } from 'react';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { IS_CONFIGURED, MODULE } from '../lib/config';
import { parseVault, type Vault } from '../lib/vault';

export function useVaults() {
  const account = useCurrentAccount();

  const { data, isLoading, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: {
        StructType: `${MODULE}::DCAVault`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account?.address && IS_CONFIGURED,
      refetchInterval: 5000,
    }
  );

  const vaults = useMemo(
    () => (data?.data ?? []).map(parseVault).filter((v): v is Vault => v !== null),
    [data]
  );

  return {
    vaults,
    isLoading: isLoading && IS_CONFIGURED,
    error,
    refetch,
  };
}

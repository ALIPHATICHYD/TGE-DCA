import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

const PACKAGE_ID = import.meta.env.TGE_PACKAGE_ID || '0x0';

export function useVaults() {
  const account = useCurrentAccount();

  const { data, isLoading, error, refetch } = useSuiClientQuery(
    'getOwnedObjects',
    {
      owner: account?.address || '',
      filter: {
        StructType: `${PACKAGE_ID}::dca::DCAVault`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account?.address,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  return {
    vaults: data?.data || [],
    isLoading,
    error,
    refetch,
  };
}

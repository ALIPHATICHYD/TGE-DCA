import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

export function useBalance() {
  const account = useCurrentAccount();

  const { data, isLoading, error } = useSuiClientQuery(
    'getBalance',
    {
      owner: account?.address || '',
      coinType: '0x2::sui::SUI',
    },
    {
      enabled: !!account?.address,
    }
  );

  // Convert from smallest unit (MIST) to SUI (9 decimals)
  const balanceInSui = data ? Number(data.totalBalance) / 1_000_000_000 : 0;

  return {
    balanceInSui,
    balanceInMist: data?.totalBalance || '0',
    isLoading,
    error,
  };
}

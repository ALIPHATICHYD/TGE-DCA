import { useEffect, useState } from 'react';
import { Box, Text, Flex, Spinner } from '@radix-ui/themes';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { DeepBookClient } from '@mysten/deepbook-v3';
import { getCurrentPrice } from '../lib/deepbookPrices';

interface DeepBookPriceDisplayProps {
  poolKey: string; // e.g., 'SUI_DBUSDC'
  fromToken: string;
  toToken: string;
  amount?: number; // Optional: amount to preview swap
}

/**
 * Component to display current DeepBook price
 * Shows current mid price and optionally expected output for a given input
 */
export function DeepBookPriceDisplay({
  poolKey,
  fromToken,
  toToken,
  amount,
}: DeepBookPriceDisplayProps) {
  const account = useCurrentAccount();
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account?.address) {
      setError('Wallet not connected');
      return;
    }

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);

      try {
        const network = (import.meta.env.VITE_DEEPBOOK_NETWORK ||
          'testnet') as 'testnet' | 'mainnet';

        const suiClient = new SuiClient({
          url: getFullnodeUrl(network),
        });

        const deepbookClient = new DeepBookClient({
          address: account.address,
          env: network,
          client: suiClient,
        });

        const currentPrice = await getCurrentPrice(poolKey, deepbookClient);
        setPrice(currentPrice);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch price'
        );
        console.error('Error fetching DeepBook price:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timeout);
  }, [account?.address, poolKey]);

  if (loading) {
    return (
      <Box
        style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '10px',
          padding: '12px',
        }}
      >
        <Flex gap="2" align="center">
          <Spinner size="1" />
          <Text size="2">Fetching price from DeepBook...</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '12px',
        }}
      >
        <Text size="2" color="red" weight="medium">
          {error}
        </Text>
      </Box>
    );
  }

  if (!price) return null;

  const expectedOutput = amount ? Math.floor(amount * price) : null;

  return (
    <Box
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        padding: '14px',
      }}
    >
      {/* Pool Info */}
      <Flex justify="between" mb="3">
        <Text size="2" color="gray">
          Pool
        </Text>
        <Text size="2" weight="bold">
          {poolKey}
        </Text>
      </Flex>

      {/* Price */}
      <Flex justify="between" mb="3">
        <Text size="2" color="gray">
          {fromToken} Price
        </Text>
        <Flex direction="column" align="end">
          <Text size="2" weight="bold">
            1 {fromToken} = {price.toFixed(6)} {toToken}
          </Text>
          <Text size="1" color="gray">
            (Mid Price from DeepBook)
          </Text>
        </Flex>
      </Flex>

      {/* Expected Output */}
      {expectedOutput !== null && (
        <Flex justify="between">
          <Text size="2" color="gray">
            Expected Output
          </Text>
          <Text size="2" weight="bold" style={{ color: 'rgba(34, 197, 94, 0.9)' }}>
            {expectedOutput.toLocaleString()} {toToken}
          </Text>
        </Flex>
      )}

      {/* Info */}
      <Text size="1" color="gray" style={{ marginTop: '8px' }}>
        📊 Live price from DeepBook v3
      </Text>
    </Box>
  );
}

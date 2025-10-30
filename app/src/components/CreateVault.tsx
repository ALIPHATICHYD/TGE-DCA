import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Card, Heading, TextField, Button, Select, Flex, Text, Spinner } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { useBalance } from '../hooks/useBalance';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0';

const TOKEN_ICONS: Record<string, string> = {
  SUI: '◎',
  USDC: '⊚',
  USDT: '₮',
};

export function CreateVault() {
  const [amount, setAmount] = useState('');
  const [amountPerTrade, setAmountPerTrade] = useState('');
  const [frequency, setFrequency] = useState('7');
  const [targetAsset, setTargetAsset] = useState('SUI');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const { balanceInSui, isLoading: isBalanceLoading } = useBalance();

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (PACKAGE_ID === '0x0') {
      setError('Package ID is not configured. Please set VITE_PACKAGE_ID environment variable.');
      return;
    }
    
    if (!amount || !amountPerTrade) {
      setError('Please fill in all fields');
      return;
    }

    if (!account?.address) {
      setError('Please connect your wallet first');
      return;
    }

    // Validate amounts are positive numbers
    const depositAmount = parseFloat(amount);
    const tradeAmount = parseFloat(amountPerTrade);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Initial Deposit must be a positive number');
      return;
    }

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      setError('Amount Per Trade must be a positive number');
      return;
    }

    // Check if deposit amount is more than balance (add small gas buffer)
    const gasBuffer = 0.001; // 0.001 SUI for transaction fees
    if (depositAmount + gasBuffer > balanceInSui) {
      setError(`Insufficient funds. You have ${balanceInSui.toFixed(4)} SUI but need at least ${(depositAmount + gasBuffer).toFixed(4)} SUI (including gas fees).`);
      return;
    }

    // Check if amount per trade is more than deposit
    if (tradeAmount > depositAmount) {
      setError('Amount Per Trade cannot be greater than Initial Deposit');
      return;
    }
    
    setIsLoading(true);

    try {
      const tx = new Transaction();
      
      // Convert amounts to smallest unit (assuming 9 decimals for SUI)
      const depositAmountBigInt = BigInt(Math.floor(depositAmount * 1_000_000_000));
      const tradeAmountBigInt = BigInt(Math.floor(tradeAmount * 1_000_000_000));
      const frequencyMs = BigInt(parseInt(frequency) * 24 * 60 * 60 * 1000);

      const [depositCoin] = tx.splitCoins(tx.gas, [depositAmountBigInt]);

      const vault = tx.moveCall({
        target: `${PACKAGE_ID}::dca::create_vault`,
        arguments: [
          depositCoin,
          tx.pure.string(targetAsset),
          tx.pure.u64(tradeAmountBigInt),
          tx.pure.u64(frequencyMs),
          tx.object('0x6'), // Clock object
        ],
        typeArguments: ['0x2::sui::SUI'],
      });

      tx.transferObjects([vault], account.address);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result: any) => {
            console.log('Vault created:', result);
            setError(null);
            setAmount('');
            setAmountPerTrade('');
            setFrequency('7');
            setTargetAsset('SUI');
            setIsLoading(false);
            
            // Invalidate query cache to trigger refetch
            setTimeout(() => {
              queryClient.invalidateQueries();
            }, 1000);
          },
          onError: (error: any) => {
            console.error('Error creating vault:', error);
            const errorMessage = error?.message || 'Unknown error';
            if (errorMessage.includes('insufficient')) {
              setError('Insufficient funds in your wallet. Please check your balance.');
            } else {
              setError(`Failed to create vault: ${errorMessage}`);
            }
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  return (
    <Card
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '24px',
      }}
    >
        {/* Header */}
        <Flex justify="between" align="center" mb="6">
          <Box>
            <Heading size="6" weight="bold" mb="1">
              Create DCA Vault
            </Heading>
            <Text size="2" color="gray">
              Set up automated dollar-cost averaging
            </Text>
          </Box>
        </Flex>

        {/* Balance Display */}
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
          }}
        >
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Available Balance
            </Text>
            <Flex gap="2" align="center">
              <Text size="3" weight="bold">
                {isBalanceLoading ? (
                  <Spinner size="1" />
                ) : (
                  `${balanceInSui.toFixed(4)} SUI`
                )}
              </Text>
              <Text size="2" color="gray">
                {TOKEN_ICONS['SUI']}
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
            }}
          >
            <Text size="2" color="red" weight="medium">
              {error}
            </Text>
          </Box>
        )}

        <form onSubmit={handleCreateVault}>
          <Flex direction="column" gap="4">
            {/* Initial Deposit */}
            <Box>
              <Flex justify="between" mb="2">
                <Text as="label" size="2" weight="medium">
                  Initial Deposit
                </Text>
                <Text size="1" color="gray">
                  {balanceInSui > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(Math.max(0, balanceInSui - 0.001).toString())}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(59, 130, 246, 0.9)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontSize: '12px',
                      }}
                    >
                      Max
                    </button>
                  )}
                </Text>
              </Flex>
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <TextField.Root
                  type="number"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  required
                  step="0.000000001"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    flex: 1,
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                />
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <span>{TOKEN_ICONS['SUI']}</span>
                  <span>SUI</span>
                </Box>
              </Box>
            </Box>

            {/* Target Asset */}
            <Box>
              <Box mb="2">
                <Text as="label" size="2" weight="medium">
                  Target Asset
                </Text>
              </Box>
              <Select.Root value={targetAsset} onValueChange={setTargetAsset}>
                <Select.Trigger
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '16px',
                  }}
                />
                <Select.Content>
                  <Select.Item value="SUI">
                    <span>{TOKEN_ICONS['SUI']} SUI</span>
                  </Select.Item>
                  <Select.Item value="USDC">
                    <span>{TOKEN_ICONS['USDC']} USDC</span>
                  </Select.Item>
                  <Select.Item value="USDT">
                    <span>{TOKEN_ICONS['USDT']} USDT</span>
                  </Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Amount Per Trade */}
            <Box>
              <Box mb="2">
                <Text as="label" size="2" weight="medium">
                  Amount Per Trade
                </Text>
              </Box>
              <Box
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <TextField.Root
                  type="number"
                  value={amountPerTrade}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setAmountPerTrade(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  required
                  step="0.000000001"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    flex: 1,
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                />
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <span>{TOKEN_ICONS['SUI']}</span>
                  <span>SUI</span>
                </Box>
              </Box>
            </Box>

            {/* Frequency */}
            <Box>
              <Box mb="2">
                <Text as="label" size="2" weight="medium">
                  Trade Frequency
                </Text>
              </Box>
              <Select.Root value={frequency} onValueChange={setFrequency}>
                <Select.Trigger
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '16px',
                  }}
                />
                <Select.Content>
                  <Select.Item value="1">⏰ Daily</Select.Item>
                  <Select.Item value="7">📅 Weekly</Select.Item>
                  <Select.Item value="14">📊 Bi-Weekly</Select.Item>
                  <Select.Item value="30">📈 Monthly</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Summary Box */}
            {amount && amountPerTrade && (
              <Box
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      Total Trades
                    </Text>
                    <Text size="2" weight="bold">
                      {Math.floor(parseFloat(amount) / parseFloat(amountPerTrade)) || 0}
                    </Text>
                  </Flex>
                  <Flex justify="between" align="center">
                    <Text size="2" color="gray">
                      Frequency
                    </Text>
                    <Text size="2" weight="bold">
                      {frequency === '1' ? 'Daily' : frequency === '7' ? 'Weekly' : frequency === '14' ? 'Bi-Weekly' : 'Monthly'}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            )}

            {/* Create Button */}
            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                background: isLoading
                  ? 'rgba(59, 130, 246, 0.5)'
                  : 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginTop: '8px',
              }}
            >
              {isLoading ? (
                <Flex gap="2" align="center" justify="center">
                  <Spinner size="1" />
                  <span>Creating Vault...</span>
                </Flex>
              ) : (
                'Create Vault'
              )}
            </Button>
          </Flex>
        </form>
      </Card>
    );
  }

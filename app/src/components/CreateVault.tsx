import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Card, Heading, TextField, Button, Select, Flex, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { useBalance } from '../hooks/useBalance';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0';

export function CreateVault() {
  const [amount, setAmount] = useState('');
  const [amountPerTrade, setAmountPerTrade] = useState('');
  const [frequency, setFrequency] = useState('7');
  const [targetAsset, setTargetAsset] = useState('SUI');
  const [isLoading, setIsLoading] = useState(false);

  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();
  const { balanceInSui, isLoading: isBalanceLoading } = useBalance();

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (PACKAGE_ID === '0x0') {
      alert('Package ID is not configured. Please set VITE_PACKAGE_ID environment variable.');
      return;
    }
    
    if (!amount || !amountPerTrade) {
      alert('Please fill in all fields');
      return;
    }

    if (!account?.address) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate amounts are positive numbers
    const depositAmount = parseFloat(amount);
    const tradeAmount = parseFloat(amountPerTrade);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Initial Deposit must be a positive number');
      return;
    }

    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      alert('Amount Per Trade must be a positive number');
      return;
    }

    // Check if deposit amount is more than balance (add small gas buffer)
    const gasBuffer = 0.001; // 0.001 SUI for transaction fees
    if (depositAmount + gasBuffer > balanceInSui) {
      alert(`Insufficient funds. You have ${balanceInSui.toFixed(4)} SUI but need at least ${(depositAmount + gasBuffer).toFixed(4)} SUI (including gas fees).`);
      return;
    }

    // Check if amount per trade is more than deposit
    if (tradeAmount > depositAmount) {
      alert('Amount Per Trade cannot be greater than Initial Deposit');
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
            alert('Vault created successfully!');
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
              alert('Insufficient funds in your wallet. Please check your balance.');
            } else {
              alert(`Failed to create vault: ${errorMessage}`);
            }
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <Heading size="5" mb="4">Create DCA Vault</Heading>
      <Box mb="4">
        <Text size="2" color="gray">
          Your Balance: {isBalanceLoading ? 'Loading...' : `${balanceInSui.toFixed(4)} SUI`}
        </Text>
      </Box>
      <form onSubmit={handleCreateVault}>
        <Flex direction="column" gap="4">
          <Box>
            <Text as="label" size="2" mb="1" weight="medium">
              Initial Deposit (SUI)
            </Text>
            <TextField.Root
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              placeholder="1000"
              required
              step="0.000000001"
            />
          </Box>

          <Box>
            <Text as="label" size="2" mb="1" weight="medium">
              Target Asset
            </Text>
            <Select.Root value={targetAsset} onValueChange={setTargetAsset}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="SUI">SUI</Select.Item>
                <Select.Item value="USDC">USDC</Select.Item>
                <Select.Item value="USDT">USDT</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box>
            <Text as="label" size="2" mb="1" weight="medium">
              Amount Per Trade (SUI)
            </Text>
            <TextField.Root
              type="number"
              value={amountPerTrade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountPerTrade(e.target.value)}
              placeholder="50"
              required
              step="0.000000001"
            />
          </Box>

          <Box>
            <Text as="label" size="2" mb="1" weight="medium">
              Frequency
            </Text>
            <Select.Root value={frequency} onValueChange={setFrequency}>
              <Select.Trigger style={{ width: '100%' }} />
              <Select.Content>
                <Select.Item value="1">Daily</Select.Item>
                <Select.Item value="7">Weekly</Select.Item>
                <Select.Item value="14">Bi-Weekly</Select.Item>
                <Select.Item value="30">Monthly</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Creating...' : 'Create Vault'}
          </Button>
        </Flex>
      </form>
    </Card>
  );
}

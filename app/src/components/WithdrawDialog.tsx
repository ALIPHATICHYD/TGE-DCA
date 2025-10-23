import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Box, Button, TextField, Flex, Text, AlertDialog } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0';

interface WithdrawDialogProps {
  vaultId: string;
  vaultBalance: number; // in SUI
  onClose: () => void;
  isOpen: boolean;
}

export function WithdrawDialog({ vaultId, vaultBalance, onClose, isOpen }: WithdrawDialogProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const queryClient = useQueryClient();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (PACKAGE_ID === '0x0') {
      alert('Package ID is not configured.');
      return;
    }

    if (!account?.address) {
      alert('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      alert('Withdraw amount must be a positive number');
      return;
    }

    if (amount > vaultBalance) {
      alert(`Insufficient balance. You have ${vaultBalance.toFixed(4)} SUI available.`);
      return;
    }

    setIsLoading(true);

    try {
      const tx = new Transaction();

      // Convert amount to smallest unit (9 decimals for SUI)
      const withdrawAmountBigInt = BigInt(Math.floor(amount * 1_000_000_000));

      // Call withdraw_funds function
      const coin = tx.moveCall({
        target: `${PACKAGE_ID}::dca::withdraw_funds`,
        arguments: [tx.object(vaultId), tx.pure.u64(withdrawAmountBigInt)],
        typeArguments: ['0x2::sui::SUI'],
      });

      // Transfer the withdrawn coin to the user
      tx.transferObjects([coin], account.address);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result: any) => {
            console.log('Withdrawal successful:', result);
            alert(`Successfully withdrew ${amount.toFixed(4)} SUI!`);
            setWithdrawAmount('');
            setIsLoading(false);
            onClose();

            // Invalidate query cache to trigger refetch
            setTimeout(() => {
              queryClient.invalidateQueries();
            }, 1000);
          },
          onError: (error: any) => {
            console.error('Error withdrawing:', error);
            alert(`Failed to withdraw: ${error?.message || 'Unknown error'}`);
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
    <AlertDialog.Root open={isOpen}>
      <AlertDialog.Content style={{ maxWidth: '500px' }}>
        <AlertDialog.Title>Withdraw SUI from Vault</AlertDialog.Title>
        <Box>
          <Text size="2" mb="4">
            Available Balance: <strong>{vaultBalance.toFixed(4)} SUI</strong>
          </Text>

          <form onSubmit={handleWithdraw}>
            <Box mb="4">
              <Box mb="2">
                <Text as="label" size="2" weight="medium">
                  Withdrawal Amount (SUI)
                </Text>
              </Box>
              <TextField.Root
                type="number"
                value={withdrawAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWithdrawAmount(e.target.value)
                }
                placeholder="Enter amount to withdraw"
                step="0.000000001"
                max={vaultBalance.toString()}
              />
            </Box>

            <Flex gap="3" justify="end">
              <Button
                variant="soft"
                onClick={onClose}
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !withdrawAmount}
              >
                {isLoading ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            </Flex>
          </form>
        </Box>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

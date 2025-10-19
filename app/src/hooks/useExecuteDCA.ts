import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = import.meta.env.TGE_PACKAGE_ID;
if (!PACKAGE_ID) {
  console.warn('TGE_PACKAGE_ID is not set in environment variables. Using fallback value "0x0".');
}
const DCA_PACKAGE_ID = PACKAGE_ID || '0x0';

export function useExecuteDCA() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const executeDCA = async (vaultId: string, onSuccess?: () => void) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${DCA_PACKAGE_ID}::dca::execute_dca`,
      arguments: [
        tx.object(vaultId),
        tx.object('0x6'), // Clock object tingy
      ],
      typeArguments: ['0x2::sui::SUI'],
    });

    signAndExecute(
      {
        transaction: tx as any,
      },
      {
        onSuccess: (result) => {
          console.log('DCA executed:', result);
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Error executing DCA:', error);
          alert('Failed to execute DCA');
        },
      }
    );
  };

  return { executeDCA };
}

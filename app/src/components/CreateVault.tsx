import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x0';

export function CreateVault() {
  const [amount, setAmount] = useState('');
  const [amountPerTrade, setAmountPerTrade] = useState('');
  const [frequency, setFrequency] = useState('7');
  const [targetAsset, setTargetAsset] = useState('SUI');
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tx = new Transaction();
      
      // Convert amounts to smallest unit (assuming 9 decimals for SUI)
      const depositAmount = BigInt(parseFloat(amount) * 1_000_000_000);
      const tradeAmount = BigInt(parseFloat(amountPerTrade) * 1_000_000_000);
      const frequencyMs = BigInt(parseInt(frequency) * 24 * 60 * 60 * 1000);

      // Split coin for deposit
      const [coin] = tx.splitCoins(tx.gas, [depositAmount]);

      // Call create_vault function
      tx.moveCall({
        target: `${PACKAGE_ID}::dca::create_vault`,
        arguments: [
          coin,
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(targetAsset))),
          tx.pure.u64(tradeAmount),
          tx.pure.u64(frequencyMs),
          tx.object('0x6'), // Clock object
        ],
        typeArguments: ['0x2::sui::SUI'],
      });

      signAndExecute(
        {
          transaction: tx as any,
        },
        {
          onSuccess: (result: any) => {
            console.log('Vault created:', result);
            alert('Vault created successfully!');
            // Reset form
            setAmount('');
            setAmountPerTrade('');
            setIsLoading(false);
          },
          onError: (error: any) => {
            console.error('Error creating vault:', error);
            alert('Failed to create vault');
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create DCA Vault</h2>
      <form onSubmit={handleCreateVault} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Initial Deposit (SUI)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
            placeholder="1000"
            required
            step="0.000000001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Target Asset
          </label>
          <select
            value={targetAsset}
            onChange={(e) => setTargetAsset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
          >
            <option value="SUI">SUI</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Amount Per Trade (SUI)
          </label>
          <input
            type="number"
            value={amountPerTrade}
            onChange={(e) => setAmountPerTrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
            placeholder="50"
            required
            step="0.000000001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
          >
            <option value="1">Daily</option>
            <option value="7">Weekly</option>
            <option value="14">Bi-Weekly</option>
            <option value="30">Monthly</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Vault'}
        </button>
      </form>
    </div>
  );
}

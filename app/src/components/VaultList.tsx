import { useVaults } from '../hooks/useVaults';
import { useExecuteDCA } from '../hooks/useExecuteDCA';
import { formatBalance, formatAddress, calculateNextExecution, isVaultReady } from '../lib/utils';
import type { VaultObject } from '../types/vault';

export function VaultList() {
  const { vaults, isLoading, refetch } = useVaults();
  const { executeDCA } = useExecuteDCA();

  if (isLoading) {
    return <div className="text-center py-8">Loading vaults...</div>;
  }

  if (!vaults || vaults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vaults found. Create your first DCA vault to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">My DCA Vaults</h2>
      {vaults.map((vault: VaultObject) => {
        const fields = vault.data?.content?.fields;
        if (!fields) return null;

        const ready = isVaultReady(fields.last_execution_ms, fields.frequency_ms);
        const nextExecution = calculateNextExecution(fields.last_execution_ms, fields.frequency_ms);

        return (
          <div key={vault.data.objectId} className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Vault ID</p>
                <p className="font-mono text-sm">{formatAddress(vault.data.objectId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`font-semibold ${fields.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {fields.is_active ? 'Active' : 'Paused'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-semibold">{formatBalance(fields.balance)} SUI</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount Per Trade</p>
                <p className="font-semibold">{formatBalance(fields.amount_per_trade)} SUI</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="font-semibold">{fields.total_executions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invested</p>
                <p className="font-semibold">{formatBalance(fields.total_invested)} SUI</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Next Execution</p>
                <p className="font-semibold">
                  {nextExecution.toLocaleString()}
                  {ready && <span className="ml-2 text-green-600">(Ready!)</span>}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => executeDCA(vault.data.objectId, refetch)}
                disabled={!ready || !fields.is_active}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Execute DCA
              </button>
              <button
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

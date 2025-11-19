import { useState } from 'react';
import { useVaults } from '../hooks/useVaults';
import { useExecuteDCA } from '../hooks/useExecuteDCA';
import { formatBalance, formatAddress, calculateNextExecution, isVaultReady } from '../lib/utils';
import { getPoolKey, getDisplayToken } from '../lib/poolMapping';
import { Box, Card, Heading, Text, Flex, Grid, Button, Badge } from '@radix-ui/themes';
import { WithdrawDialog } from './WithdrawDialog';
import { DeepBookPriceDisplay } from './DeepBookPriceDisplay';

export function VaultList() {
  const { vaults, isLoading, refetch } = useVaults();
  const { executeDCA } = useExecuteDCA();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [selectedVaultBalance, setSelectedVaultBalance] = useState(0);

  if (isLoading) {
    return (
      <Box py="8" style={{ textAlign: 'center' }}>
        <Text>Loading vaults...</Text>
      </Box>
    );
  }

  // Filter out vaults with 0 balance
  const activeVaults = vaults?.filter((vault) => {
    if (!vault.data || !vault.data.content) return false;
    if (vault.data.content.dataType !== 'moveObject') return false;
    
    const fields = vault.data.content.fields as any;
    if (!fields) return false;
    
    const vaultBalance = Number(formatBalance(fields.balance));
    return vaultBalance > 0;
  }) || [];

  if (!vaults || vaults.length === 0) {
    return (
      <Box py="8" style={{ textAlign: 'center' }}>
        <Text color="gray">
          No vaults found. Create your first DCA vault to get started!
        </Text>
      </Box>
    );
  }

  if (activeVaults.length === 0) {
    return (
      <Box py="8" style={{ textAlign: 'center' }}>
        <Text color="gray">
          All vaults have been emptied. Create a new vault to continue!
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="5" mb="6">My DCA Vaults</Heading>
      
      {/* Vaults Grid */}
      <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4" mb="6">
        {activeVaults.map((vault) => {
          try {
            if (!vault.data || !vault.data.content) return null;
            if (vault.data.content.dataType !== 'moveObject') return null;
            
            const fields = vault.data.content.fields as any;
            if (!fields) return null;

            // Safely extract target_asset - could be a string or Move String object
            let targetAsset = 'USDC'; // Default
            if (fields.target_asset) {
              if (typeof fields.target_asset === 'string') {
                targetAsset = fields.target_asset;
              } else if (fields.target_asset?.bytes) {
                // Move String type - has bytes property
                targetAsset = fields.target_asset.bytes;
              } else if (typeof fields.target_asset === 'object' && fields.target_asset[0]) {
                targetAsset = String(fields.target_asset[0]);
              }
            }

            const ready = isVaultReady(fields.last_execution_ms, fields.frequency_ms);
            const nextExecution = calculateNextExecution(fields.last_execution_ms, fields.frequency_ms);
            const balance = Number(formatBalance(fields.balance));

            return (
            <Card
              key={vault.data.objectId}
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(79, 70, 229, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59, 130, 246, 0.15)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              {/* Header: Status Badge */}
              <Flex justify="between" align="start" mb="4">
                <Box>
                  <Text size="1" color="gray">Vault</Text>
                </Box>
                <Badge color={fields.is_active ? 'green' : 'red'}>
                  {fields.is_active ? 'Active' : 'Paused'}
                </Badge>
              </Flex>

              {/* Main Balance Display */}
              <Box mb="4">
                <Text size="1" color="gray" mb="1">
                  Current Balance
                </Text>
                <Text size="6" weight="bold" mb="2">
                  💧 {balance.toFixed(2)}
                </Text>
                <Text size="1" color="gray">
                  SUI
                </Text>
              </Box>

              {/* Stats Grid */}
              <Grid columns="2" gap="3" mb="4">
                <Box
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <Text size="1" color="gray">Per Trade</Text>
                  <Text size="2" weight="bold">
                    {formatBalance(fields.amount_per_trade)}
                  </Text>
                  <Text size="1" color="gray">SUI</Text>
                </Box>

                <Box
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <Text size="1" color="gray">Executions</Text>
                  <Text size="2" weight="bold">
                    {fields.total_executions}
                  </Text>
                </Box>

                <Box
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <Text size="1" color="gray">Invested</Text>
                  <Text size="2" weight="bold">
                    {formatBalance(fields.total_invested)}
                  </Text>
                  <Text size="1" color="gray">SUI</Text>
                </Box>

                <Box
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '12px',
                  }}
                >
                  <Text size="1" color="gray">Status</Text>
                  <Text
                    size="2"
                    weight="bold"
                    color={ready ? 'green' : 'gray'}
                  >
                    {ready ? '✓ Ready' : 'Pending'}
                  </Text>
                </Box>
              </Grid>

              {/* Next Execution Info */}
              <Box
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '16px',
                }}
              >
                <Text size="1" color="gray" mb="1">
                  Next Execution
                </Text>
                <Text size="1" weight="medium">
                  {nextExecution.toLocaleString()}
                </Text>
              </Box>

              {/* DeepBook Price Display */}
              <Box mb="4">
                <DeepBookPriceDisplay
                  poolKey={getPoolKey(targetAsset, (import.meta.env.VITE_DEEPBOOK_NETWORK || 'testnet') as 'testnet' | 'mainnet')}
                  fromToken="SUI"
                  toToken={getDisplayToken(targetAsset, (import.meta.env.VITE_DEEPBOOK_NETWORK || 'testnet') as 'testnet' | 'mainnet')}
                  amount={Number(formatBalance(fields.amount_per_trade))}
                />
              </Box>

              {/* ID Display */}
              <Box mb="4">
                <Text size="1" color="gray">ID</Text>
                <Text
                  size="1"
                  style={{
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    opacity: 0.7,
                  }}
                >
                  {formatAddress(vault.data.objectId)}
                </Text>
              </Box>

              {/* Action Buttons */}
              <Flex gap="2">
                <Button
                  onClick={() => executeDCA(vault.data!.objectId, refetch)}
                  disabled={!ready || !fields.is_active}
                  style={{ flex: 1 }}
                >
                  Execute
                </Button>
                <Button
                  variant="soft"
                  onClick={() => {
                    setSelectedVaultId(vault.data!.objectId);
                    setSelectedVaultBalance(balance);
                    setWithdrawDialogOpen(true);
                  }}
                >
                  Withdraw
                </Button>
                <Button variant="soft">
                  Settings
                </Button>
              </Flex>
            </Card>
            );
          } catch (error) {
            console.error('Error rendering vault card:', error);
            return null;
          }
        })}
      </Grid>

      {selectedVaultId && (
        <WithdrawDialog
          vaultId={selectedVaultId}
          vaultBalance={selectedVaultBalance}
          isOpen={withdrawDialogOpen}
          onClose={() => {
            setWithdrawDialogOpen(false);
            setSelectedVaultId(null);
          }}
        />
      )}
    </Box>
  );
}

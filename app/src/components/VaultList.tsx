import { useVaults } from '../hooks/useVaults';
import { useExecuteDCA } from '../hooks/useExecuteDCA';
import { formatBalance, formatAddress, calculateNextExecution, isVaultReady } from '../lib/utils';
import { Box, Card, Heading, Text, Flex, Grid, Button, Badge } from '@radix-ui/themes';

export function VaultList() {
  const { vaults, isLoading, refetch } = useVaults();
  const { executeDCA } = useExecuteDCA();

  if (isLoading) {
    return (
      <Box py="8" style={{ textAlign: 'center' }}>
        <Text>Loading vaults...</Text>
      </Box>
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <Box py="8" style={{ textAlign: 'center' }}>
        <Text color="gray">
          No vaults found. Create your first DCA vault to get started!
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="5" mb="4">My DCA Vaults</Heading>
      <Flex direction="column" gap="4">
        {vaults.map((vault) => {
          if (!vault.data || !vault.data.content) return null;
          if (vault.data.content.dataType !== 'moveObject') return null;
          
          const fields = vault.data.content.fields as any;
          if (!fields) return null;

          const ready = isVaultReady(fields.last_execution_ms, fields.frequency_ms);
          const nextExecution = calculateNextExecution(fields.last_execution_ms, fields.frequency_ms);

          return (
            <Card key={vault.data.objectId}>
              <Grid columns="2" gap="4" mb="4">
                <Box>
                  <Text size="2" color="gray">Vault ID</Text>
                  <Text size="2" style={{ fontFamily: 'monospace' }}>
                    {formatAddress(vault.data.objectId)}
                  </Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Status</Text>
                  <Badge color={fields.is_active ? 'green' : 'red'}>
                    {fields.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </Box>
                <Box>
                  <Text size="2" color="gray">Balance</Text>
                  <Text weight="bold">{formatBalance(fields.balance)} SUI</Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Amount Per Trade</Text>
                  <Text weight="bold">{formatBalance(fields.amount_per_trade)} SUI</Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Total Executions</Text>
                  <Text weight="bold">{fields.total_executions}</Text>
                </Box>
                <Box>
                  <Text size="2" color="gray">Total Invested</Text>
                  <Text weight="bold">{formatBalance(fields.total_invested)} SUI</Text>
                </Box>
                <Box style={{ gridColumn: 'span 2' }}>
                  <Text size="2" color="gray">Next Execution</Text>
                  <Text weight="bold">
                    {nextExecution.toLocaleString()}
                    {ready && <Text color="green" ml="2">(Ready!)</Text>}
                  </Text>
                </Box>
              </Grid>

              <Flex gap="2">
                <Button
                  onClick={() => executeDCA(vault.data!.objectId, refetch)}
                  disabled={!ready || !fields.is_active}
                  style={{ flex: 1 }}
                >
                  Execute DCA
                </Button>
                <Button variant="soft">
                  Settings
                </Button>
              </Flex>
            </Card>
          );
        })}
      </Flex>
    </Box>
  );
}

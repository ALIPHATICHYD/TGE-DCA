export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 9): string {
  const num = Number(BigInt(balance)) / (10 ** decimals);
  return num.toFixed(4);
}

export function calculateNextExecution(
  lastExecutionMs: string,
  frequencyMs: string
): Date {
  const last = parseInt(lastExecutionMs);
  const freq = parseInt(frequencyMs);
  return new Date(last + freq);
}

export function isVaultReady(
  lastExecutionMs: string,
  frequencyMs: string
): boolean {
  const nextExecution = calculateNextExecution(lastExecutionMs, frequencyMs);
  return Date.now() >= nextExecution.getTime();
}

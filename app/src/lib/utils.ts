export function formatAddress(address: string): string {
  if (!address || typeof address !== 'string') return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBalance(balance: string, decimals: number = 9): string {
  if (!balance || typeof balance !== 'string') return '0.0000';
  try {
    const num = Number(BigInt(balance)) / (10 ** decimals);
    return num.toFixed(4);
  } catch (e) {
    console.error('Error formatting balance:', balance, e);
    return '0.0000';
  }
}

export function calculateNextExecution(
  lastExecutionMs: string,
  frequencyMs: string
): Date {
  try {
    const last = parseInt(lastExecutionMs || '0');
    const freq = parseInt(frequencyMs || '0');
    if (isNaN(last) || isNaN(freq)) {
      return new Date();
    }
    return new Date(last + freq);
  } catch (e) {
    console.error('Error calculating next execution:', e);
    return new Date();
  }
}

export function isVaultReady(
  lastExecutionMs: string,
  frequencyMs: string
): boolean {
  try {
    const nextExecution = calculateNextExecution(lastExecutionMs, frequencyMs);
    return Date.now() >= nextExecution.getTime();
  } catch (e) {
    console.error('Error checking vault ready:', e);
    return false;
  }
}

const DECIMALS = 9;
const SCALE = 10n ** BigInt(DECIMALS);

/** Parse a user-typed decimal string into MIST without float rounding. Returns null if invalid. */
export function toMist(value: string): bigint | null {
  const v = value.trim();
  if (!/^\d*\.?\d*$/.test(v) || v === '' || v === '.') return null;
  const [whole = '0', frac = ''] = v.split('.');
  const fracPadded = (frac + '0'.repeat(DECIMALS)).slice(0, DECIMALS);
  return BigInt(whole || '0') * SCALE + BigInt(fracPadded || '0');
}

export function fromMist(mist: bigint | string | number | undefined | null): number {
  if (mist === undefined || mist === null || mist === '') return 0;
  try {
    return Number(BigInt(mist)) / Number(SCALE);
  } catch {
    return 0;
  }
}

export function fmt(n: number, digits = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function shortAddr(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const DAY = 86_400_000;

export function freqLabel(ms: number): string {
  const days = ms / DAY;
  if (Number.isInteger(days)) return `${days}d`;
  const hours = ms / 3_600_000;
  return Number.isInteger(hours) ? `${hours}h` : `${Math.round(ms / 60000)}m`;
}

/** "04:12:33" under a day, "3d 04h" above. */
export function countdown(ms: number): string {
  if (ms <= 0) return 'READY';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (x: number) => String(x).padStart(2, '0');
  return d > 0 ? `${d}d ${p(h)}h` : `${p(h)}:${p(m)}:${p(sec)}`;
}

export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isoDateTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 16).replace('T', ' ');
}

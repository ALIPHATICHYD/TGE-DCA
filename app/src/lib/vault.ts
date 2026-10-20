import type { SuiObjectResponse } from '@mysten/sui/client';
import { fromMist } from './units';

export interface Vault {
  id: string;
  owner: string;
  balance: number;
  /** Exact on-chain balance, for full withdrawals. */
  balanceMist: bigint;
  perTrade: number;
  frequencyMs: number;
  lastExecutionMs: number;
  executions: number;
  invested: number;
  active: boolean;
  target: string;
}

export type VaultState = 'active' | 'paused' | 'completed';

function decodeTarget(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    try {
      return new TextDecoder().decode(new Uint8Array(raw as number[]));
    } catch {
      return 'USDC';
    }
  }
  if (raw && typeof raw === 'object' && 'bytes' in raw) return String((raw as { bytes: unknown }).bytes);
  return 'USDC';
}

export function parseVault(obj: SuiObjectResponse): Vault | null {
  const content = obj.data?.content;
  if (!content || content.dataType !== 'moveObject') return null;
  const f = content.fields as Record<string, any>;
  if (!f) return null;
  return {
    id: obj.data!.objectId,
    owner: String(f.owner ?? ''),
    balance: fromMist(f.balance),
    balanceMist: BigInt(f.balance ?? 0),
    perTrade: fromMist(f.amount_per_trade),
    frequencyMs: Number(f.frequency_ms ?? 0),
    lastExecutionMs: Number(f.last_execution_ms ?? 0),
    executions: Number(f.total_executions ?? 0),
    invested: fromMist(f.total_invested),
    active: Boolean(f.is_active),
    target: decodeTarget(f.target_asset_type ?? f.target_asset),
  };
}

export function vaultState(v: Vault): VaultState {
  if (v.balance <= 0) return 'completed';
  return v.active ? 'active' : 'paused';
}

export function nextExecutionMs(v: Vault): number {
  return v.lastExecutionMs + v.frequencyMs;
}

/** Mirrors `is_ready_for_execution` in the Move module. */
export function isReady(v: Vault, now: number): boolean {
  return v.active && now >= nextExecutionMs(v) && v.balance >= v.perTrade && v.perTrade > 0;
}

export function buysLeft(v: Vault): number {
  return v.perTrade > 0 ? Math.floor(v.balance / v.perTrade + 1e-9) : 0;
}

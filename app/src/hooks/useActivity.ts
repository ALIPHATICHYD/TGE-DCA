import { useMemo } from 'react';
import { useSuiClientQueries } from '@mysten/dapp-kit';
import { IS_CONFIGURED, MODULE } from '../lib/config';
import { fromMist } from '../lib/units';

export type ActivityKind = 'create' | 'buy' | 'fund' | 'withdraw';

export interface Activity {
  kind: ActivityKind;
  vaultId: string;
  amount: number;
  timestampMs: number;
  digest: string;
  executionNumber?: number;
}

const EVENTS: { type: string; kind: ActivityKind }[] = [
  { type: 'VaultCreated', kind: 'create' },
  { type: 'DCAExecuted', kind: 'buy' },
  { type: 'VaultFunded', kind: 'fund' },
  { type: 'VaultWithdrawn', kind: 'withdraw' },
];

/**
 * Recent vault events for the given vault ids, newest first.
 * Events are global to the package, so they are filtered to the user's vaults here.
 */
export function useActivity(vaultIds: string[], limit = 50) {
  const ids = useMemo(() => new Set(vaultIds), [vaultIds]);

  const { data, isLoading } = useSuiClientQueries({
    queries: EVENTS.map((e) => ({
      method: 'queryEvents' as const,
      params: {
        query: { MoveEventType: `${MODULE}::${e.type}` },
        order: 'descending' as const,
        limit,
      },
      options: { enabled: IS_CONFIGURED && vaultIds.length > 0, refetchInterval: 15_000 },
    })),
    combine: (results) => ({
      data: results.map((r) => r.data),
      isLoading: results.some((r) => r.isLoading),
    }),
  });

  const activity = useMemo(() => {
    const out: Activity[] = [];
    data.forEach((page, i) => {
      for (const ev of page?.data ?? []) {
        const j = ev.parsedJson as Record<string, any>;
        if (!j || !ids.has(j.vault_id)) continue;
        const kind = EVENTS[i].kind;
        out.push({
          kind,
          vaultId: j.vault_id,
          amount: fromMist(kind === 'buy' ? j.amount_spent : kind === 'create' ? 0 : j.amount),
          timestampMs: Number(j.timestamp_ms ?? ev.timestampMs ?? 0),
          digest: ev.id.txDigest,
          executionNumber: j.execution_number !== undefined ? Number(j.execution_number) : undefined,
        });
      }
    });
    return out.sort((a, b) => b.timestampMs - a.timestampMs);
  }, [data, ids]);

  return { activity, isLoading: isLoading && vaultIds.length > 0 };
}

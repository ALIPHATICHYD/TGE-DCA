import type { Activity } from '../hooks/useActivity';
import { explorerTx } from '../lib/explorer';
import { fmt, isoDateTime, shortAddr } from '../lib/units';

const KIND_LABEL: Record<Activity['kind'], string> = {
  create: 'CREATE',
  buy: 'BUY',
  fund: 'TOP UP',
  withdraw: 'WITHDRAW',
};

export function ActivityLog({ items, showVault = true, empty }: { items: Activity[]; showVault?: boolean; empty: string }) {
  if (items.length === 0) {
    return (
      <div className="box mono muted" style={{ padding: 20, fontSize: 13 }}>
        {empty}
      </div>
    );
  }
  return (
    <div className="ledger">
      {items.map((a) => (
        <div key={`${a.digest}-${a.kind}`} className="ledger-row log-grid">
          <span className="muted">{isoDateTime(a.timestampMs)}</span>
          <span>
            <span className={a.kind === 'buy' ? 'signal' : undefined}>
              {KIND_LABEL[a.kind]}
              {a.executionNumber ? ` #${String(a.executionNumber).padStart(2, '0')}` : ''}
            </span>
            {showVault && <span className="muted"> · {shortAddr(a.vaultId)}</span>}
          </span>
          <span>{a.kind === 'create' ? '—' : `${fmt(a.amount)} SUI`}</span>
          <a href={explorerTx(a.digest)} target="_blank" rel="noreferrer" style={{ textAlign: 'right' }}>
            tx ↗
          </a>
        </div>
      ))}
    </div>
  );
}

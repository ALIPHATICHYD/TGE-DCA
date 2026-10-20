import { useMemo, useState } from 'react';
import { ActivityLog } from '../components/ActivityLog';
import { ConfigNotice } from '../components/ConfigNotice';
import { MarketPanel } from '../components/MarketPanel';
import { DitherField } from '../components/brand/DitherField';
import { Icon } from '../components/brand/Icon';
import { Meter } from '../components/brand/Meter';
import { EmptyChart, StepChart, type StepPoint } from '../components/charts/StepChart';
import { MarketTicker } from '../components/layout/MarketTicker';
import { useActivity } from '../hooks/useActivity';
import { useNow } from '../hooks/useNow';
import { useVaultActions } from '../hooks/useVaultActions';
import { useVaults } from '../hooks/useVaults';
import { href } from '../lib/router';
import { countdown, fmt, freqLabel, shortAddr } from '../lib/units';
import { buysLeft, isReady, nextExecutionMs, vaultState, type Vault, type VaultState } from '../lib/vault';

const TABS: { key: VaultState; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'completed', label: 'Completed' },
];

export function Dashboard() {
  const { vaults, isLoading } = useVaults();
  const now = useNow();
  const [tab, setTab] = useState<VaultState>('active');
  const ids = useMemo(() => vaults.map((v) => v.id), [vaults]);
  const { activity } = useActivity(ids);

  const totals = useMemo(() => {
    const live = vaults.filter((v) => vaultState(v) === 'active');
    const next = live.length ? Math.min(...live.map(nextExecutionMs)) : null;
    return {
      balance: vaults.reduce((s, v) => s + v.balance, 0),
      invested: vaults.reduce((s, v) => s + v.invested, 0),
      executions: vaults.reduce((s, v) => s + v.executions, 0),
      next,
    };
  }, [vaults]);

  const counts = useMemo(() => {
    const c: Record<VaultState, number> = { active: 0, paused: 0, completed: 0 };
    vaults.forEach((v) => c[vaultState(v)]++);
    return c;
  }, [vaults]);

  const shown = vaults.filter((v) => vaultState(v) === tab);

  const investedSeries: StepPoint[] = useMemo(() => {
    const buys = activity.filter((a) => a.kind === 'buy').sort((a, b) => a.timestampMs - b.timestampMs);
    let sum = 0;
    return buys.map((b) => ({ t: b.timestampMs, v: (sum += b.amount) }));
  }, [activity]);

  return (
    <>
      <MarketTicker
        extra={
          totals.next
            ? [
                <>
                  NEXT EXECUTION <b>{countdown(totals.next - now)}</b>
                </>,
              ]
            : []
        }
      />
      <main className="wrap" style={{ paddingBlock: '40px 80px' }}>
        <ConfigNotice />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 20, marginBottom: 32 }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>
              Portfolio · {vaults.length} {vaults.length === 1 ? 'vault' : 'vaults'}
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(56px, 8vw, 96px)', textTransform: 'none' }}>
              {isLoading ? '····' : fmt(totals.balance)} <span className="muted" style={{ fontSize: '0.42em' }}>SUI</span>
            </h1>
          </div>
          <a className="btn btn-primary" href={href.create}>
            <Icon name="plus" size={14} /> New vault
          </a>
        </div>

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat">
            <span className="label">In vaults</span>
            <span className="figure">{fmt(totals.balance)}</span>
          </div>
          <div className="stat">
            <span className="label">Invested so far</span>
            <span className="figure">{fmt(totals.invested)}</span>
          </div>
          <div className="stat">
            <span className="label">Executions</span>
            <span className="figure">{totals.executions}</span>
          </div>
          <div className="stat stat-hot">
            <span className="label">Next buy in</span>
            <span className="figure mono" style={{ letterSpacing: '-0.02em' }}>
              {totals.next ? countdown(totals.next - now) : '—'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <figure className="box" style={{ flex: '999 1 600px', minWidth: 0 }}>
            <div className="box-head label">
              <span style={{ color: 'var(--bone)' }}>Invested over time</span>
              <span>{investedSeries.length} buys</span>
            </div>
            {investedSeries.length > 0 ? (
              <StepChart
                points={investedSeries}
                until={now}
                label={`Cumulative SUI invested across ${investedSeries.length} buys`}
              />
            ) : (
              <EmptyChart text="No buys yet. Your first execution draws the first step." />
            )}
          </figure>
          <div style={{ flex: '1 1 300px' }}>
            <MarketPanel />
          </div>
        </div>

        <section aria-labelledby="vaults-h">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <h2 id="vaults-h" className="display" style={{ fontSize: 40, fontWeight: 800 }}>
              Your vaults
            </h2>
            <div className="segmented" role="tablist" aria-label="Filter vaults">
              {TABS.map((t) => (
                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label} {counts[t.key]}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <EmptyChart text="Loading vaults…" height={160} />
          ) : vaults.length === 0 ? (
            <NoVaults />
          ) : shown.length === 0 ? (
            <div className="box mono muted" style={{ padding: 20, fontSize: 13 }}>
              No {tab} vaults.
            </div>
          ) : (
            <VaultLedger vaults={shown} now={now} />
          )}
        </section>

        <section aria-labelledby="activity-h" style={{ marginTop: 48 }}>
          <h2 id="activity-h" className="display" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
            Activity
          </h2>
          <ActivityLog items={activity.slice(0, 12)} empty="Nothing yet. Vault events show up here as they land on-chain." />
        </section>
      </main>
    </>
  );
}

function VaultLedger({ vaults, now }: { vaults: Vault[]; now: number }) {
  const { execute, pending } = useVaultActions();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="ledger">
      <div className="ledger-row head vault-grid">
        <span>Vault</span>
        <span>Balance</span>
        <span>Per buy</span>
        <span>Every</span>
        <span>Progress</span>
        <span>Next</span>
        <span style={{ textAlign: 'right' }}>Actions</span>
      </div>
      {vaults.map((v) => {
        const ready = isReady(v, now);
        const total = v.executions + buysLeft(v);
        const state = vaultState(v);
        return (
          <div key={v.id} className="ledger-row vault-grid">
            <a href={href.vault(v.id)} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>SUI → {v.target}</span>
              <span className="mono muted" style={{ fontSize: 12 }}>
                {shortAddr(v.id)}
              </span>
            </a>
            <span className="mono">{fmt(v.balance)}</span>
            <span className="mono">{fmt(v.perTrade)}</span>
            <span className="mono muted">{freqLabel(v.frequencyMs)}</span>
            <Meter done={v.executions} total={total} />
            <span className="mono" style={{ fontSize: 13 }}>
              {state === 'paused' ? (
                <span className="muted">PAUSED</span>
              ) : state === 'completed' ? (
                <span className="muted">DONE</span>
              ) : ready ? (
                <span className="signal">READY</span>
              ) : (
                countdown(nextExecutionMs(v) - now)
              )}
            </span>
            <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!ready || pending !== null}
                onClick={async () => {
                  setBusy(v.id);
                  await execute(v.id);
                  setBusy(null);
                }}
              >
                {busy === v.id && pending === 'execute' ? <span className="spin" aria-label="Executing" /> : 'Execute'}
              </button>
              <a className="btn btn-quiet btn-sm" href={href.vault(v.id)}>
                Manage
              </a>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function NoVaults() {
  return (
    <div className="box" style={{ position: 'relative', minHeight: 280, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
      <DitherField mode="flat" width={200} height={70} fps={10} />
      <div style={{ position: 'relative', padding: 32, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
        <h3 className="display" style={{ fontSize: 56, background: 'var(--ink)', padding: '4px 10px' }}>
          No vaults yet.
        </h3>
        <a className="btn btn-primary btn-lg" href={href.create}>
          Open your first vault <Icon name="arrowRight" size={14} />
        </a>
      </div>
    </div>
  );
}

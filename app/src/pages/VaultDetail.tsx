import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ActivityLog } from '../components/ActivityLog';
import { explorerObject } from '../lib/explorer';
import { ConfigNotice } from '../components/ConfigNotice';
import { Icon } from '../components/brand/Icon';
import { EmptyChart, StepChart, type StepPoint } from '../components/charts/StepChart';
import { MarketPanel } from '../components/MarketPanel';
import { useToast } from '../hooks/useToast';
import { useActivity } from '../hooks/useActivity';
import { useBalance } from '../hooks/useBalance';
import { useNow } from '../hooks/useNow';
import { useVaultActions, type ActionName } from '../hooks/useVaultActions';
import { useVaults } from '../hooks/useVaults';
import { GAS_BUFFER_SUI } from '../lib/config';
import { FREQUENCY_OPTIONS } from '../lib/constants';
import { href } from '../lib/router';
import { countdown, fmt, freqLabel, isoDate, shortAddr, toMist } from '../lib/units';
import { buysLeft, isReady, nextExecutionMs, vaultState, type Vault } from '../lib/vault';

export function VaultDetail({ id }: { id: string }) {
  const { vaults, isLoading } = useVaults();
  const vault = vaults.find((v) => v.id === id);

  return (
    <main className="wrap" style={{ paddingBlock: '24px 80px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a href={href.home} className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Icon name="arrowLeft" size={14} /> All vaults
        </a>
        <span className="mono muted" style={{ fontSize: 12, display: 'flex', gap: 14, alignItems: 'center' }}>
          {shortAddr(id)}
          <button
            type="button"
            className="mono"
            style={{ background: 'none', border: 0, color: 'var(--bone)', cursor: 'pointer', fontSize: 12, minHeight: 32 }}
            onClick={() => navigator.clipboard?.writeText(id)}
          >
            copy
          </button>
          <a href={explorerObject(id)} target="_blank" rel="noreferrer">
            explorer ↗
          </a>
        </span>
      </div>
      <ConfigNotice />
      {vault ? (
        <VaultBody vault={vault} />
      ) : isLoading ? (
        <EmptyChart text="Loading vault…" />
      ) : (
        <div className="box" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <h1 className="display" style={{ fontSize: 56 }}>
            Vault not found.
          </h1>
          <p className="muted">It isn't owned by the connected wallet, or it belongs to a different network.</p>
          <a className="btn btn-ghost" href={href.home}>
            Back to vaults
          </a>
        </div>
      )}
    </main>
  );
}

function VaultBody({ vault: v }: { vault: Vault }) {
  const now = useNow();
  const actions = useVaultActions();
  const ids = useMemo(() => [v.id], [v.id]);
  const { activity } = useActivity(ids);
  const state = vaultState(v);
  const ready = isReady(v, now);
  const busy = actions.pending !== null;

  const series: StepPoint[] = useMemo(() => {
    let sum = 0;
    return activity
      .filter((a) => a.kind === 'buy')
      .sort((a, b) => a.timestampMs - b.timestampMs)
      .map((a) => ({ t: a.timestampMs, v: (sum += a.amount) }));
  }, [activity]);

  const created = activity.find((a) => a.kind === 'create');

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 24, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <span className={`tag${state === 'active' ? ' tag-hot' : ''}`}>{state}</span>
            {state === 'active' && <span className="tag">{ready ? 'Ready to execute' : `Next buy in ${countdown(nextExecutionMs(v) - now)}`}</span>}
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(64px, 9vw, 104px)' }}>
            SUI <span className="signal">→</span> {v.target}
          </h1>
          <p className="mono muted" style={{ marginTop: 14, fontSize: 14 }}>
            {fmt(v.perTrade)} SUI every {freqLabel(v.frequencyMs)}
            {created ? ` · created ${isoDate(created.timestampMs)}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="btn btn-primary btn-lg" disabled={!ready || busy} onClick={() => actions.execute(v.id)}>
            {actions.pending === 'execute' ? <span className="spin" /> : <Icon name="play" size={14} />} Execute now
          </button>
          {state === 'active' && (
            <button type="button" className="btn btn-ghost btn-lg" disabled={busy} onClick={() => actions.pause(v.id)}>
              {actions.pending === 'pause' ? <span className="spin" /> : <Icon name="pause" size={14} />} Pause
            </button>
          )}
          {state === 'paused' && (
            <button type="button" className="btn btn-ghost btn-lg" disabled={busy} onClick={() => actions.resume(v.id)}>
              {actions.pending === 'resume' ? <span className="spin" /> : <Icon name="play" size={14} />} Resume
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginTop: 32 }}>
        <div style={{ flex: '999 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="stat-grid">
            <div className="stat">
              <span className="label">Balance</span>
              <span className="figure">{fmt(v.balance)}</span>
            </div>
            <div className="stat">
              <span className="label">Invested</span>
              <span className="figure">{fmt(v.invested)}</span>
            </div>
            <div className="stat">
              <span className="label">Executions</span>
              <span className="figure">{v.executions}</span>
            </div>
            <div className="stat">
              <span className="label">Buys left</span>
              <span className="figure">{buysLeft(v)}</span>
            </div>
          </div>

          <figure className="box">
            <div className="box-head label">
              <span style={{ color: 'var(--bone)' }}>Invested by this vault</span>
              <span>{series.length} executions</span>
            </div>
            {series.length > 0 ? (
              <StepChart points={series} until={now} label={`Cumulative SUI invested by this vault over ${series.length} executions`} />
            ) : (
              <EmptyChart text={state === 'active' ? `First buy ${ready ? 'is ready now' : `in ${countdown(nextExecutionMs(v) - now)}`}` : 'No executions yet.'} />
            )}
          </figure>

          <section aria-labelledby="log-h">
            <h2 id="log-h" className="label" style={{ marginBottom: 12, color: 'var(--bone)' }}>
              Execution log
            </h2>
            <ActivityLog items={activity} showVault={false} empty="No events for this vault yet." />
          </section>
        </div>

        <aside style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <SettingsForm vault={v} />
          <AmountForm
            title="Add funds"
            cta="Deposit to vault"
            hint={(amt) => `Adds ${Math.floor(amt / (v.perTrade || 1))} more buys at the current rules.`}
            pendingName="fund"
            maxLabel="wallet"
            useMax={useWalletMax}
            onSubmit={(mist) => actions.fund(v.id, mist)}
            pending={actions.pending}
          />
          <AmountForm
            title="Withdraw"
            cta="Withdraw to wallet"
            hint={(amt) => `Leaves ${fmt(Math.max(0, v.balance - amt))} SUI · ${Math.floor(Math.max(0, v.balance - amt) / (v.perTrade || 1))} more buys.`}
            pendingName="withdraw"
            maxLabel={`of ${fmt(v.balance)}`}
            useMax={() => v.balance}
            onSubmit={(mist) => actions.withdraw(v.id, mist)}
            pending={actions.pending}
          />
          <div style={{ border: '1px dashed var(--signal)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="label signal">Close vault</h2>
            <p className="muted" style={{ fontSize: 14 }}>
              Returns the full balance and pauses the schedule in one transaction. The vault stays in your history under
              Completed.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy || (v.balance <= 0 && !v.active)}
              onClick={() => {
                if (window.confirm(`Withdraw ${fmt(v.balance, 4)} SUI and pause this vault?`)) {
                  actions.close(v.id, v.balanceMist, v.active);
                }
              }}
            >
              {actions.pending === 'close' ? <span className="spin" /> : null} Withdraw all &amp; pause
            </button>
          </div>
          <MarketPanel target={v.target} />
        </aside>
      </div>
    </>
  );
}

function useWalletMax() {
  const { balanceInSui } = useBalance();
  return Math.max(0, balanceInSui - GAS_BUFFER_SUI);
}

function Panel({ title, tag, children, onSubmit, bone }: { title: string; tag?: string; children: ReactNode; onSubmit: (e: FormEvent) => void; bone?: boolean }) {
  return (
    <form className={bone ? 'box-bone' : 'box'} onSubmit={onSubmit} noValidate>
      <div className="box-head label">
        <h2 style={{ font: 'inherit', color: 'var(--bone)' }}>{title}</h2>
        {tag && <span>{tag}</span>}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </form>
  );
}

function SettingsForm({ vault: v }: { vault: Vault }) {
  const { update, pending } = useVaultActions();
  const { notify } = useToast();
  const [per, setPer] = useState(String(v.perTrade));
  const matched = FREQUENCY_OPTIONS.find((f) => f.ms === v.frequencyMs);
  const [freqMs, setFreqMs] = useState(v.frequencyMs);

  useEffect(() => {
    setPer(String(v.perTrade));
    setFreqMs(v.frequencyMs);
  }, [v.perTrade, v.frequencyMs]);

  const dirty = parseFloat(per) !== v.perTrade || freqMs !== v.frequencyMs;

  return (
    <Panel
      title="Settings"
      tag="update_vault"
      bone
      onSubmit={(e) => {
        e.preventDefault();
        const mist = toMist(per);
        if (!mist || mist <= 0n) return notify('Each buy must be more than 0.', 'error');
        update(v.id, mist, freqMs);
      }}
    >
      <div>
        <label htmlFor="set-per" className="label" style={{ display: 'block', marginBottom: 8 }}>
          Each buy (SUI)
        </label>
        <input id="set-per" className="input" inputMode="decimal" value={per} onChange={(e) => setPer(e.target.value)} />
      </div>
      <fieldset style={{ border: 0, padding: 0 }}>
        <legend className="label" style={{ marginBottom: 8 }}>
          Every{!matched ? ` (now ${freqLabel(v.frequencyMs)})` : ''}
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
          {FREQUENCY_OPTIONS.map((f) => (
            <button key={f.ms} type="button" className="pill pill-center" style={{ minHeight: 44 }} aria-pressed={freqMs === f.ms} onClick={() => setFreqMs(f.ms)}>
              {f.days}D
            </button>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="btn btn-bone" disabled={!dirty || pending !== null}>
        {pending === 'update' ? <span className="spin" /> : null} Save rules
      </button>
    </Panel>
  );
}

function AmountForm({
  title,
  cta,
  hint,
  pendingName,
  maxLabel,
  useMax,
  onSubmit,
  pending,
}: {
  title: string;
  cta: string;
  hint: (amount: number) => string;
  pendingName: 'fund' | 'withdraw';
  maxLabel: string;
  useMax: () => number;
  onSubmit: (mist: bigint) => Promise<boolean>;
  pending: ActionName | null;
}) {
  const { notify } = useToast();
  const max = useMax();
  const [amount, setAmount] = useState('');
  const amt = parseFloat(amount) || 0;
  const id = `amt-${pendingName}`;

  return (
    <Panel
      title={title}
      onSubmit={async (e) => {
        e.preventDefault();
        const mist = toMist(amount);
        if (!mist || mist <= 0n) return notify('Enter an amount more than 0.', 'error');
        if (amt > max + 1e-9) return notify(`That's more than the ${fmt(max, 4)} SUI available.`, 'error');
        if (await onSubmit(mist)) setAmount('');
      }}
    >
      <label htmlFor={id} className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Amount (SUI)</span>
        <span>{maxLabel === 'wallet' ? `wallet ${fmt(max)}` : maxLabel}</span>
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input id={id} className="input" style={{ flex: 1, minWidth: 0 }} inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button type="button" className="btn btn-quiet btn-sm" style={{ minHeight: 48 }} onClick={() => setAmount((max / 4).toFixed(4))}>
          25%
        </button>
        <button type="button" className="btn btn-quiet btn-sm" style={{ minHeight: 48 }} onClick={() => setAmount(max.toFixed(9).replace(/\.?0+$/, ''))}>
          Max
        </button>
      </div>
      {amt > 0 && (
        <p className="mono muted" style={{ fontSize: 12 }}>
          {hint(amt)}
        </p>
      )}
      <button type="submit" className="btn btn-ghost" disabled={pending !== null || amt <= 0}>
        {pending === pendingName ? <span className="spin" /> : null} {cta}
      </button>
    </Panel>
  );
}

import { useMemo, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ConfigNotice } from '../components/ConfigNotice';
import { Icon } from '../components/brand/Icon';
import { WalletButton } from '../components/layout/WalletButton';
import { useBalance } from '../hooks/useBalance';
import { useMidPrice } from '../hooks/useMarket';
import { useVaultActions } from '../hooks/useVaultActions';
import { GAS_BUFFER_SUI } from '../lib/config';
import { FREQUENCY_OPTIONS, TARGET_ASSETS } from '../lib/constants';
import { href, navigate } from '../lib/router';
import { fmt, isoDate, toMist } from '../lib/units';

const TAPE_MAX = 36;

export function CreateVault() {
  const account = useCurrentAccount();
  const { balanceInSui, isLoading: balanceLoading } = useBalance();
  const { create, pending } = useVaultActions();
  const [deposit, setDeposit] = useState('');
  const [per, setPer] = useState('');
  const [freqDays, setFreqDays] = useState(7);
  const [target, setTarget] = useState(TARGET_ASSETS[0].symbol);
  const [touched, setTouched] = useState(false);
  const { price } = useMidPrice(target);

  const freq = FREQUENCY_OPTIONS.find((f) => f.days === freqDays)!;
  const maxDeposit = Math.max(0, balanceInSui - GAS_BUFFER_SUI);

  const plan = useMemo(() => {
    const dep = parseFloat(deposit) || 0;
    const p = parseFloat(per) || 0;
    const buys = p > 0 ? Math.floor(dep / p + 1e-9) : 0;
    const spanMs = buys > 1 ? (buys - 1) * freq.ms : 0;
    // The first buy is due one period after creation.
    const lastBuy = Date.now() + freq.ms + spanMs;
    const days = Math.round((buys * freq.ms) / 86_400_000);
    const runs = days >= 60 ? `${Math.round(days / 30)} mo` : days >= 14 ? `${Math.round(days / 7)} wk` : `${days} d`;
    return { dep, p, buys, lastBuy, runs };
  }, [deposit, per, freq.ms]);

  const error = (() => {
    if (!deposit || !per) return 'Fill in the deposit and the size of each buy.';
    if (toMist(deposit) === null || toMist(per) === null) return 'Use numbers only, like 25 or 12.5.';
    if (plan.dep <= 0) return 'Deposit must be more than 0.';
    if (plan.p <= 0) return 'Each buy must be more than 0.';
    if (plan.p > plan.dep) return 'Each buy cannot be larger than the deposit.';
    if (account && !balanceLoading && plan.dep > maxDeposit)
      return `That's more than your wallet holds. Max is ${fmt(maxDeposit, 4)} SUI (keeps ${GAS_BUFFER_SUI} SUI for gas).`;
    return null;
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error || !account) return;
    const ok = await create({
      deposit: toMist(deposit)!,
      perTrade: toMist(per)!,
      frequencyMs: freq.ms,
      target,
    });
    if (ok) navigate(href.home);
  };

  return (
    <main className="wrap" style={{ paddingBlock: '32px 80px' }}>
      <a href={href.home} className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        <Icon name="arrowLeft" size={14} /> Back to vaults
      </a>
      <ConfigNotice />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        <form onSubmit={submit} noValidate style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              New vault
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(56px, 7vw, 88px)' }}>
              Write the
              <br />
              rules once.
            </h1>
          </div>

          <div className="field">
            <label htmlFor="deposit" className="label">
              <span>Initial deposit</span>
              {account && (
                <button
                  type="button"
                  className="mono"
                  style={{ background: 'none', border: 0, color: 'var(--bone)', cursor: 'pointer', fontSize: 12, padding: 0, minHeight: 24 }}
                  onClick={() => setDeposit(maxDeposit.toFixed(4))}
                >
                  Max {balanceLoading ? '…' : fmt(maxDeposit, 4)}
                </button>
              )}
            </label>
            <div className="field-row">
              <input
                id="deposit"
                className="field-input"
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
              <span className="chip">
                <Icon name="coin" size={14} className="signal" /> SUI
              </span>
            </div>
          </div>

          <fieldset style={{ border: 0, padding: 0 }}>
            <legend className="label" style={{ marginBottom: 10 }}>
              Buy
            </legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {TARGET_ASSETS.map((a) => (
                <button key={a.symbol} type="button" className="pill" aria-pressed={target === a.symbol} onClick={() => setTarget(a.symbol)}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, textTransform: 'none' }}>{a.symbol}</span>
                  <span style={{ fontSize: 11, opacity: 0.8, textTransform: 'none' }}>{a.note}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="per" className="label">
              <span>Each buy</span>
            </label>
            <div className="field-row">
              <input
                id="per"
                className="field-input"
                style={{ fontSize: 44 }}
                inputMode="decimal"
                placeholder="0.00"
                autoComplete="off"
                value={per}
                onChange={(e) => setPer(e.target.value)}
              />
              <span className="mono muted" style={{ fontSize: 13 }}>
                SUI
              </span>
            </div>
          </div>

          <fieldset style={{ border: 0, padding: 0 }}>
            <legend className="label" style={{ marginBottom: 10 }}>
              Every
            </legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              {FREQUENCY_OPTIONS.map((f) => (
                <button key={f.days} type="button" className="pill pill-center" aria-pressed={freqDays === f.days} onClick={() => setFreqDays(f.days)}>
                  {f.label}
                </button>
              ))}
            </div>
          </fieldset>

          {touched && error && (
            <p className="notice" role="alert">
              {error}
            </p>
          )}

          {account ? (
            <button type="submit" className="btn btn-primary btn-xl" disabled={pending === 'create'}>
              {pending === 'create' ? (
                <>
                  <span className="spin" /> Waiting for wallet…
                </>
              ) : (
                'Sign & create vault'
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
              <WalletButton size="lg" />
              <span className="mono muted" style={{ fontSize: 12 }}>
                Connect a wallet to create the vault.
              </span>
            </div>
          )}
          <p className="mono muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Creates a vault object owned by your address. You can pause, top up, change the rules or withdraw everything
            at any time.
          </p>
        </form>

        <aside className="box-bone" style={{ flex: '1 1 420px', minWidth: 0, alignSelf: 'start' }} aria-label="Schedule preview">
          <div className="box-head label">
            <span style={{ color: 'var(--bone)' }}>Schedule tape</span>
            <span className="signal">preview</span>
          </div>
          <div className="dither-rule" style={{ padding: '24px 20px', display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 160, alignContent: 'flex-start' }}>
            {Array.from({ length: Math.min(plan.buys, TAPE_MAX) }, (_, i) => (
              <span
                key={`${plan.buys}-${i}`}
                className="pop"
                title={`Buy ${i + 1}`}
                style={{
                  width: 22,
                  height: 22,
                  animationDelay: `${i * 0.03}s`,
                  ...(i % 4 === 0
                    ? { background: 'var(--signal)' }
                    : {
                        backgroundImage: 'radial-gradient(var(--signal) 1.2px, transparent 1.4px)',
                        backgroundSize: '3px 3px',
                        border: '1px solid var(--signal)',
                      }),
                }}
              />
            ))}
            {plan.buys > TAPE_MAX && (
              <span className="mono muted" style={{ fontSize: 12, alignSelf: 'center' }}>
                +{plan.buys - TAPE_MAX} more
              </span>
            )}
            {plan.buys === 0 && (
              <span className="label" style={{ background: 'var(--ink)', padding: '6px 10px' }}>
                Enter a deposit and buy size
              </span>
            )}
          </div>
          <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', borderTop: '1px solid var(--rule)' }}>
            <Cell label="Buys" big value={String(plan.buys)} />
            <Cell label="Runs for" big value={plan.buys ? plan.runs : '—'} last />
            <Cell label="First buy" value={plan.buys ? isoDate(Date.now() + freq.ms) : '—'} />
            <Cell label="Last buy ≈" value={plan.buys ? isoDate(plan.lastBuy) : '—'} last />
          </dl>
          <div className="mono muted" style={{ padding: '14px 20px', borderTop: '1px solid var(--rule)', fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span>Each buy at DeepBook mid</span>
            <span style={{ color: 'var(--bone)' }}>{price && plan.p > 0 ? `≈ ${fmt(plan.p * price)} ${target}` : '—'}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Cell({ label, value, big, last }: { label: string; value: string; big?: boolean; last?: boolean }) {
  return (
    <div style={{ padding: '18px 20px', borderRight: last ? 0 : '1px solid var(--rule)', borderBottom: big ? '1px solid var(--rule)' : 0 }}>
      <dt className="label">{label}</dt>
      <dd className={big ? 'figure' : 'mono'} style={{ margin: '4px 0 0', fontSize: big ? 44 : 16 }}>
        {value}
      </dd>
    </div>
  );
}

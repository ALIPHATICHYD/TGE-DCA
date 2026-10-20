import type { ReactNode } from 'react';
import { DitherField } from '../components/brand/DitherField';
import { Icon, type IconName } from '../components/brand/Icon';
import { MarketTicker } from '../components/layout/MarketTicker';
import { WalletButton } from '../components/layout/WalletButton';
import { href } from '../lib/router';

const STEPS: { n: string; icon: IconName; title: string; body: string }[] = [
  {
    n: '01',
    icon: 'vault',
    title: 'Deposit',
    body: "Mint a personal vault object on Sui and fund it. It is owned by your address and nobody else's.",
  },
  {
    n: '02',
    icon: 'clock',
    title: 'Set the rhythm',
    body: 'Choose the asset, the size of each buy, and how often: daily, weekly, every two weeks or monthly.',
  },
  {
    n: '03',
    icon: 'chart',
    title: 'Let it stack',
    body: "Each slot executes against DeepBook's order book. Withdraw any time; the vault never asks permission.",
  },
];

const PILLARS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'lock', title: 'Non-custodial vaults', body: 'Funds live in a Move object owned by your address. Only you can withdraw.' },
  { icon: 'shield', title: 'Nautilus TEE execution', body: 'Order logic runs in attested enclaves; the chain verifies every attestation.' },
  { icon: 'key', title: 'Seal encryption', body: 'Strategy data stays encrypted with session keys, still verifiable on-chain.' },
  { icon: 'chart', title: 'DeepBook execution', body: "Every buy hits Sui's native central limit order book. No hidden spread." },
  { icon: 'user', title: 'zkLogin onboarding', body: 'Start with a Google account. Graduate to a wallet whenever you want.' },
  { icon: 'bolt', title: 'Sponsored gas', body: 'Execution fees can be sponsored, so small recurring buys stay worth it.' },
];

function Section({ id, children, light }: { id?: string; children: ReactNode; light?: boolean }) {
  return (
    <section
      id={id}
      className="rule-b"
      style={light ? { background: 'var(--bone)', color: 'var(--ink)' } : undefined}
    >
      <div className="wrap" style={{ paddingBlock: 96 }}>
        {children}
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <>
      <MarketTicker />

      <section className="rule-b" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="dither-bg" style={{ position: 'absolute', inset: 0, opacity: 0.16 }} aria-hidden="true" />
        <div
          className="wrap"
          style={{
            position: 'relative',
            paddingTop: 72,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
            gap: 48,
            alignItems: 'end',
          }}
        >
          <div style={{ paddingBottom: 72 }}>
            <div className="eyebrow rise" style={{ marginBottom: 28 }}>
              ● Non-custodial DCA on Sui
            </div>
            <h1 className="display rise" style={{ fontSize: 'clamp(72px, 11vw, 168px)', animationDelay: '.1s' }}>
              Buy the
              <br />
              boring
              <br />
              <span className="signal">way.</span>
            </h1>
            <p
              className="rise"
              style={{ marginTop: 32, maxWidth: 460, fontSize: 19, color: 'var(--bone-2)', animationDelay: '.25s' }}
            >
              Your funds sit in a vault only you control. You set the amount and the rhythm. DeepBook fills the
              order. Nobody holds your keys, ever.
            </p>
            <div className="rise" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 36, animationDelay: '.4s' }}>
              <WalletButton size="lg" />
              <a className="btn btn-ghost btn-lg" href="#machine">
                See how it averages
              </a>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              alignSelf: 'stretch',
              minHeight: 520,
              borderLeft: '1px solid var(--rule)',
              borderRight: '1px solid var(--rule)',
            }}
          >
            <DitherField mode="accumulation" width={240} height={180} />
            <div
              className="label"
              style={{ position: 'absolute', left: 20, top: 20, right: 20, display: 'flex', justifyContent: 'space-between' }}
            >
              <span>fig.01 · accumulation field</span>
              <span>
                live<span className="blink signal"> ■</span>
              </span>
            </div>
            <div
              className="mono"
              style={{
                position: 'absolute',
                left: 20,
                bottom: 20,
                width: 'min(300px, calc(100% - 40px))',
                background: 'var(--ink)',
                border: '1px solid var(--bone)',
                fontSize: 12,
                lineHeight: 1.7,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
                <span>EXAMPLE VAULT</span>
                <span className="signal">ACTIVE</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0 4px' }}>
                300.00 <span className="muted" style={{ fontSize: 13 }}>SUI</span>
              </div>
              <div className="signal" style={{ letterSpacing: '0.2em' }}>
                ▮▮▮▮▮▮▮<span style={{ color: 'var(--rule)' }}>▮▮▮▮▮</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
                <span>7 / 12 buys</span>
                <span>every 7d</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section id="how">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'end', gap: 24, marginBottom: 56 }}>
          <h2 className="display" style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800 }}>
            Three moves.
            <br />
            Then nothing.
          </h2>
          <p className="muted" style={{ maxWidth: 380, fontSize: 16 }}>
            Set it once. The vault keeps buying on schedule until the balance runs out or you pause it.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', borderTop: '1px solid var(--bone)' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                padding: '32px 28px 40px',
                paddingLeft: i === 0 ? 0 : 28,
                borderRight: i < STEPS.length - 1 ? '1px solid var(--rule)' : 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono signal" style={{ fontSize: 13 }}>
                  {s.n}
                </span>
                <Icon name={s.icon} size={32} />
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 800 }}>{s.title}</h3>
              <p className="muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="machine" light>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 56, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
              fig.02 · the machine
            </div>
            <h2 className="display" style={{ fontSize: 'clamp(56px, 7vw, 88px)' }}>
              Same money.
              <br />
              Every price.
            </h2>
            <p style={{ marginTop: 28, maxWidth: 440, fontSize: 18, lineHeight: 1.55 }}>
              A fixed amount buys more when the price is low and less when it's high. Your average entry smooths out.
              No timing, no charts at 3am.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 36, borderTop: '2px solid var(--ink)' }}>
              <div style={{ padding: '16px 16px 0 0', borderRight: '1px solid var(--ink)' }}>
                <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase' }}>Each buy</div>
                <div className="figure" style={{ fontSize: 40 }}>Fixed size</div>
              </div>
              <div style={{ padding: '16px 0 0 16px' }}>
                <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase' }}>Your entry</div>
                <div className="figure" style={{ fontSize: 40 }}>Averaged</div>
              </div>
            </div>
          </div>
          <figure style={{ border: '2px solid var(--ink)' }}>
            <svg
              viewBox="0 0 600 380"
              style={{ width: '100%', height: 'auto' }}
              role="img"
              aria-label="Illustration: price moves up and down while equal-sized buys land at regular intervals; the average entry line stays flatter than price"
            >
              <defs>
                <pattern id="m-d25" width="4" height="4" patternUnits="userSpaceOnUse">
                  <rect width="1" height="1" fill="#0A0A09" />
                  <rect x="2" y="2" width="1" height="1" fill="#0A0A09" />
                </pattern>
                <pattern id="m-d50" width="2" height="2" patternUnits="userSpaceOnUse">
                  <rect width="1" height="1" fill="#0A0A09" />
                  <rect x="1" y="1" width="1" height="1" fill="#0A0A09" />
                </pattern>
                <pattern id="m-or" width="3" height="3" patternUnits="userSpaceOnUse">
                  <rect width="2" height="2" fill="#FF5A1F" />
                </pattern>
              </defs>
              <g shapeRendering="crispEdges">
                <path d="M0 220 L50 180 L100 240 L150 200 L200 290 L250 250 L300 310 L350 230 L400 270 L450 170 L500 200 L550 120 L600 150 L600 380 L0 380Z" fill="url(#m-d25)" />
                <path d="M0 260 L150 300 L300 330 L450 310 L600 290 L600 380 L0 380Z" fill="url(#m-d50)" />
                {[
                  [46, 300],
                  [146, 290],
                  [246, 268],
                  [346, 290],
                  [446, 316],
                  [546, 326],
                ].map(([x, y]) => (
                  <rect key={x} x={x} y={y} width="10" height={380 - y} fill="url(#m-or)" />
                ))}
              </g>
              <path d="M0 220 L50 180 L100 240 L150 200 L200 290 L250 250 L300 310 L350 230 L400 270 L450 170 L500 200 L550 120 L600 150" fill="none" stroke="#0A0A09" strokeWidth="3" />
              <path d="M0 232 L600 226" fill="none" stroke="#FF5A1F" strokeWidth="3" strokeDasharray="10 6" />
              <g fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#0A0A09">
                <text x="14" y="28">PRICE</text>
                <text x="456" y="214" fill="#C23A08">AVG ENTRY</text>
                <text x="14" y="368">BUYS ▮ = units acquired</text>
              </g>
            </svg>
          </figure>
        </div>
      </Section>

      <Section id="security">
        <h2 className="display" style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, marginBottom: 48 }}>
          Trust math,
          <br />
          <span className="signal">not a desk.</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            borderTop: '1px solid var(--rule)',
            borderLeft: '1px solid var(--rule)',
          }}
        >
          {PILLARS.map((p) => (
            <div
              key={p.title}
              style={{ padding: 28, borderRight: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', display: 'flex', gap: 18 }}
            >
              <Icon name={p.icon} size={28} className="signal" />
              <div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>{p.title}</h3>
                <p className="muted">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="rule-b" style={{ position: 'relative', minHeight: 520, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <DitherField mode="horizon" width={320} height={140} />
        <div className="wrap" style={{ position: 'relative', paddingBlock: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 32 }}>
          <h2 className="display" style={{ fontSize: 'clamp(72px, 12vw, 180px)', textShadow: '0 0 0 var(--ink), 6px 6px 0 var(--ink)' }}>
            Start
            <br />
            stacking.
          </h2>
          <a className="btn btn-xl" href={href.create} style={{ background: 'var(--ink)', border: '1px solid var(--bone)' }}>
            Open your vault <span className="blink signal">_</span>
          </a>
        </div>
      </section>
    </>
  );
}

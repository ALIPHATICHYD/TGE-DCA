import { useMidPrice, useOrderBook } from '../hooks/useMarket';
import { fmt } from '../lib/units';

function depth(q: number, max: number) {
  return '▮'.repeat(Math.max(1, Math.round((q / (max || 1)) * 9)));
}

/** Live DeepBook mid price and the best levels either side. */
export function MarketPanel({ target = 'USDC' }: { target?: string }) {
  const { price, poolKey, isLoading, error } = useMidPrice(target);
  const { book } = useOrderBook(target, 3);
  const max = Math.max(1, ...book.bids.map((l) => l.quantity), ...book.asks.map((l) => l.quantity));

  return (
    <aside className="box" style={{ display: 'flex', flexDirection: 'column' }} aria-label="DeepBook market">
      <div className="box-head label">
        <span style={{ color: 'var(--bone)' }}>DeepBook · live</span>
        <span className="blink signal">■</span>
      </div>
      <div style={{ padding: 20, borderBottom: '1px solid var(--rule)' }}>
        <div className="label">{poolKey.replace('_', ' / ')} · mid</div>
        <div className="figure" style={{ fontSize: 48 }}>
          {price ? price.toFixed(4) : isLoading ? '····' : '—'}
        </div>
        {error && !price && (
          <div className="mono muted" style={{ fontSize: 12 }}>
            Price feed unavailable right now.
          </div>
        )}
      </div>
      {book.bids.length + book.asks.length === 0 ? (
        <div className="mono muted" style={{ padding: '14px 20px', fontSize: 12 }}>
          No order book levels near the mid.
        </div>
      ) : (
        <div
          className="mono"
          style={{ padding: '12px 20px 18px', fontSize: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 6, color: 'var(--mute)' }}
        >
          <span>BID</span>
          <span style={{ textAlign: 'right' }}>SIZE</span>
          <span style={{ textAlign: 'right' }}>DEPTH</span>
          {book.bids.map((l) => (
            <BookRow key={`b${l.price}`} price={l.price} qty={l.quantity} bar={depth(l.quantity, max)} hot />
          ))}
          <span style={{ marginTop: 8 }}>ASK</span>
          <span />
          <span />
          {book.asks.map((l) => (
            <BookRow key={`a${l.price}`} price={l.price} qty={l.quantity} bar={depth(l.quantity, max)} />
          ))}
        </div>
      )}
    </aside>
  );
}

function BookRow({ price, qty, bar, hot }: { price: number; qty: number; bar: string; hot?: boolean }) {
  return (
    <>
      <span style={{ color: 'var(--bone)' }}>{price.toFixed(4)}</span>
      <span style={{ textAlign: 'right' }}>{fmt(qty, 0)}</span>
      <span style={{ textAlign: 'right', color: hot ? 'var(--signal)' : 'var(--bone)', overflow: 'hidden' }}>{bar}</span>
    </>
  );
}

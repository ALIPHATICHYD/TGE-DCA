import type { ReactNode } from 'react';
import { DEEPBOOK_NETWORK } from '../../lib/config';
import { useMidPrice } from '../../hooks/useMarket';
import { Ticker } from '../brand/Ticker';

export function MarketTicker({ extra = [] }: { extra?: ReactNode[] }) {
  const { price, poolKey } = useMidPrice('USDC');
  const pair = poolKey.replace('_', '/');
  return (
    <Ticker
      items={[
        <>
          {pair} <b>{price ? price.toFixed(4) : '—'}</b> <span className="signal">MID</span>
        </>,
        <>DEEPBOOK V3 · {DEEPBOOK_NETWORK.toUpperCase()}</>,
        ...extra,
        <>
          CUSTODY · <span className="signal">YOURS</span>
        </>,
        <>EXECUTION · ON-CHAIN, AUDITABLE</>,
        <>SETTLEMENT · SUI</>,
      ]}
    />
  );
}

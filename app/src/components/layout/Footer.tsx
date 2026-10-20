import { NETWORK } from '../../lib/config';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)', marginTop: 'auto' }}>
      <div
        className="wrap label"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', paddingBlock: 32 }}
      >
        <span>TGE/DCA · Built on Sui {NETWORK}</span>
        <span>Not financial advice · Smart contracts carry risk</span>
        <a href="https://github.com/ALIPHATICHYD/TGE-DCA" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </div>
    </footer>
  );
}

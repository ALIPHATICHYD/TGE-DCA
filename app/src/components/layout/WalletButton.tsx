import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useBalance } from '../../hooks/useBalance';
import { fmt, shortAddr } from '../../lib/units';
import { Icon } from '../brand/Icon';
import { useToast } from '../../hooks/useToast';

export function WalletButton({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { balanceInSui, isLoading } = useBalance();
  const { notify } = useToast();

  if (!account) {
    return (
      <ConnectModal
        trigger={
          <button type="button" className={`btn btn-primary${size === 'lg' ? ' btn-lg' : ''}`}>
            Connect wallet <Icon name="arrowRight" size={14} />
          </button>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}
        title="Copy address"
        onClick={() => {
          navigator.clipboard?.writeText(account.address).then(() => notify('Address copied.'));
        }}
      >
        <span style={{ width: 8, height: 8, background: 'var(--signal)', display: 'inline-block' }} />
        {shortAddr(account.address)}
        <span className="muted">· {isLoading ? '…' : `${fmt(balanceInSui)} SUI`}</span>
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ borderLeft: 0, padding: '0 14px' }}
        aria-label="Disconnect wallet"
        title="Disconnect"
        onClick={() => disconnect()}
      >
        <Icon name="power" size={14} />
      </button>
    </div>
  );
}

import { useCurrentAccount } from '@mysten/dapp-kit';
import { Logo } from '../brand/Logo';
import { NETWORK } from '../../lib/config';
import { href, type Route } from '../../lib/router';
import { WalletButton } from './WalletButton';

export function Header({ route }: { route: Route }) {
  const account = useCurrentAccount();

  return (
    <header className="site-header rule-b">
      <div className="wrap">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28 }}>
          <a href={href.home} aria-label="TGE DCA home">
            <Logo />
          </a>
          {account ? (
            <nav className="nav" aria-label="App">
              <a href={href.home} aria-current={route.name === 'home' || route.name === 'vault' ? 'page' : undefined}>
                Vaults
              </a>
              <a href={href.create} aria-current={route.name === 'create' ? 'page' : undefined}>
                New vault
              </a>
            </nav>
          ) : (
            <nav className="nav" aria-label="Primary">
              <a href="#how">How it works</a>
              <a href="#machine">The machine</a>
              <a href="#security">Security</a>
              <a href="https://github.com/ALIPHATICHYD/TGE-DCA" target="_blank" rel="noreferrer">
                Contract
              </a>
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <span className="tag">{NETWORK}</span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}

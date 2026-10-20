import { useCurrentAccount } from '@mysten/dapp-kit';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { CreateVault } from './pages/CreateVault';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { VaultDetail } from './pages/VaultDetail';
import { href, useRoute } from './lib/router';

function NotFound() {
  return (
    <main className="wrap" style={{ paddingBlock: 96, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'flex-start' }}>
      <span className="eyebrow">404</span>
      <h1 className="display" style={{ fontSize: 'clamp(64px, 10vw, 140px)' }}>
        Nothing
        <br />
        here.
      </h1>
      <a className="btn btn-ghost btn-lg" href={href.home}>
        Back home
      </a>
    </main>
  );
}

function App() {
  const route = useRoute();
  const account = useCurrentAccount();

  let page;
  switch (route.name) {
    case 'home':
      page = account ? <Dashboard /> : <Landing />;
      break;
    case 'create':
      page = <CreateVault />;
      break;
    case 'vault':
      page = account ? <VaultDetail id={route.id} /> : <Landing />;
      break;
    default:
      page = <NotFound />;
  }

  return (
    <>
      <Header route={route} />
      {page}
      <Footer />
    </>
  );
}

export default App;

import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'create' }
  | { name: 'vault'; id: string }
  | { name: 'notFound' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  // In-page anchors (#how, #security) belong to the home page.
  if (!path.startsWith('/') || path === '/') return { name: 'home' };
  if (path === '/create') return { name: 'create' };
  const m = path.match(/^\/vault\/(0x[0-9a-fA-F]+)$/);
  if (m) return { name: 'vault', id: m[1] };
  return { name: 'notFound' };
}

export const href = {
  home: '#/',
  create: '#/create',
  vault: (id: string) => `#/vault/${id}`,
};

export function navigate(to: string) {
  window.location.hash = to.replace(/^#/, '');
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      if (window.location.hash.startsWith('#/')) window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

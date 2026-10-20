import { IS_CONFIGURED } from '../lib/config';

/** Shown when the app was built without a package id, so vault calls can't work. */
export function ConfigNotice() {
  if (IS_CONFIGURED) return null;
  return (
    <div className="notice" role="alert" style={{ marginBottom: 24 }}>
      VITE_PACKAGE_ID is not set, so vaults can't be read or created. Copy <b>app/.env.example</b> to{' '}
      <b>app/.env</b>, set the published package id, and restart the dev server.
    </div>
  );
}

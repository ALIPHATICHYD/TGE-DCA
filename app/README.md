# TGE/DCA — web app

Vite + React front end for the TGE DCA vaults on Sui, styled with the "Ledger Noise" identity
(ink, bone and signal orange; Archivo + JetBrains Mono; Bayer-dithered fields; pixel icons; stepped motion).

## Setup

```bash
cp .env.example .env   # then set VITE_PACKAGE_ID to the published tge_dca package
npm install
npm run dev
```

| Variable | Purpose |
| --- | --- |
| `VITE_PACKAGE_ID` | Published `tge_dca` package id. Without it the app shows a setup notice and vault calls are disabled. |
| `VITE_SUI_NETWORK` | `devnet`, `testnet` or `mainnet` for wallet and vault reads. Defaults to `testnet`. |
| `VITE_DEEPBOOK_NETWORK` | Network for DeepBook prices (`testnet` or `mainnet`). |

## Pages

Hash-routed, no router dependency:

- `#/` — landing when no wallet is connected, the vault dashboard once one is.
- `#/create` — create a vault, with a live schedule preview.
- `#/vault/<id>` — vault detail: execute, pause/resume, settings (`update_vault`), add funds, withdraw, close.

## Scripts

`npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

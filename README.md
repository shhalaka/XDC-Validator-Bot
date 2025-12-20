# XDCAlert

Node.js service that listens to `XDCValidator` contract events on the XDC network and posts a tweet per event.

## What it watches

It listens to these events (from your provided contract):

- `Vote(_voter, _candidate, _cap)`
- `Unvote(_voter, _candidate, _cap)`
- `Propose(_owner, _candidate, _cap)`
- `Resign(_owner, _candidate)`
- `Withdraw(_owner, _blockNumber, _cap)`
- `UploadedKYC(_owner, kycHash)`
- `InvalidatedNode(_masternodeOwner, _masternodes)`

Each tweet includes the event type, key addresses, cap (when present), block number, and an explorer link to the transaction.

## Setup

1) Install deps (you can use `npm`):

```bash
npm install
```

2) Create your env file:

- Copy `config/example.env` to `.env` (or `config/local.env`) and fill values.
- If you don’t want `.env`, you can also set `ENV_FILE=/full/path/to/your.env` before running.

Required:
- `RPC_HTTP_URL`
- `CONTRACT_ADDRESS` (accepts `0x...` or `xdc...`)
- Twitter keys:
  - `TWITTER_APP_KEY`
  - `TWITTER_APP_SECRET`
  - `TWITTER_ACCESS_TOKEN`
  - `TWITTER_ACCESS_SECRET`

Helpful:
- `START_BLOCK` (set this once on first run so you control where it starts)
- `DRY_RUN=true` (prints tweets instead of posting)

## Run

Dev (watch):

```bash
npm run dev
```

Build + start:

```bash
npm run build
npm start
```

## Notes

- The service checkpoints the last processed block and processed event IDs in `.data/checkpoint.json` so it does not double-tweet after restarts.
- It polls via HTTP RPC (no websocket required).



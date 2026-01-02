# XDCAlert

A Node.js service that monitors the **XDCValidator** contract on the XDC Network and posts structured updates to X (Twitter).

The bot primarily operates in an **event-driven** manner and also supports **snapshot-based validator analytics** generated via CLI commands.

It has evolved from a simple event watcher into a more reliable monitoring tool with safeguards against duplicate alerts and rate-limit issues.

---

## What it watches

The service listens to the following validator-related on-chain events:

- `Vote(_voter, _candidate, _cap)`
- `Unvote(_voter, _candidate, _cap)`
- `Propose(_owner, _candidate, _cap)`
- `Resign(_owner, _candidate)`
- `Withdraw(_owner, _blockNumber, _cap)`
- `UploadedKYC(_owner, kycHash)`
- `InvalidatedNode(_masternodeOwner, _masternodes)`

Each alert tweet includes:

- Event type  
- Relevant addresses  
- Stake / cap (when applicable)  
- Block number  
- Explorer link to the transaction  

Alerts are **edge-triggered** and are posted only for newly observed events.

---

## Validator Snapshots & Analytics

The bot can record a **daily snapshot** of validator state derived from RPC data, including:

- Total validators  
- Active validators  
- Standby validators  
- Resigned validators  

Snapshots are stored locally and form the basis for historical analysis.

---

## Periodic Validator Statistics (CLI-Driven)

Using stored snapshots, the bot can generate validator statistics over different time windows via CLI commands:

- **Weekly validator stats**
- **Monthly validator stats**
- **Yearly validator stats**

These statistics include:

- Validator count changes (deltas)
- Average active and standby validators
- Clear date ranges for transparency

All statistics are generated **manually via CLI** and respect dry-run and rate-limit logic.

---

## Masternode Awareness & Network Health Tweets

The bot also supports informational and awareness-focused tweets, such as:

- Network health overviews
- Active vs standby validator explanations
- General validator participation insights

These help translate raw validator data into ecosystem-friendly information.

---

## Rate-Limit Handling (X API)

The Twitter/X posting layer includes basic production safeguards:

- Detects **HTTP 429 (rate-limit)** responses
- Respects `retry-after` headers when available
- Applies controlled backoff delays
- Limits retry attempts
- Aborts on non-retryable errors

This prevents aggressive retries and reduces the risk of account throttling.

---

## Dry-Run Mode

For development and testing:

- `DRY_RUN=true` prints tweet content instead of posting
- Allows safe preview of formatting and logic before live posting

---

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Environment configuration

Copy config/example.env to .env (or config/local.env)

Required variables

RPC_HTTP_URL
CONTRACT_ADDRESS (accepts 0x... or xdc...)

Twitter/X API keys:

TWITTER_APP_KEY
TWITTER_APP_SECRET
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_SECRET

Helpful options:

START_BLOCK – control the initial event scanning point
DRY_RUN=true – disable live posting

## Running the Bot

Build and start
npm run build
npm start

## CLI Commands

Validator statistics can be generated using:

npm run cli -- weekly-validator-stats
npm run cli -- monthly-validator-stats
npm run cli -- yearly-validator-stats
npm run cli -- monthly-masternode-awareness


These commands:

Read from stored snapshots
Generate formatted output
Respect dry-run and rate-limit handling

## Data & Reliability Notes

Processed blocks and event IDs are checkpointed to prevent duplicate alerts
Daily snapshots are written once per calendar day
Periodic statistics handle missing days gracefully
Operates entirely over HTTP RPC 

## Summary

This bot is designed to be:

Event-aware – reacts only to real on-chain changes
Insightful – snapshot-based historical analytics
Safe – duplicate protection and rate-limit handling
Extensible – CLI-driven design suitable for future automation

It serves as a reliable monitoring and communication layer for the XDC validator ecosystem.
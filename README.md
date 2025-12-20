XDC-Validator-Bot
Automated Twitter/X bot for monitoring XDC Network health, validator statistics, 
and on-chain token events such as mint, burn, and large transfers.

Project Status
This project is currently under active development.
Additional features and refinements are being added as part of ongoing work.

Current Features
- Automated posting to Twitter/X
- Daily network statistics (in progress)
- On-chain event detection for mint, burn, and high-value transfers(in progress)
- Validator and standby node monitoring (in progress)
- Logging and error tracking

Tech Stack
- Node.js
- TypeScript
- Twitter/X API
- Cron jobs / scheduled tasks

Project Structure
src/
bot/
services/
stats/
utils/
index.ts

Setup (Development)
1. Clone the repository
2. Install dependencies - npm install
3. Create a `.env` file using `.env.example`
4. Run the bot - npm run dev

Environment Variables
The following environment variables are required:
- TWITTER_API_KEY
- TWITTER_API_SECRET
- TWITTER_ACCESS_TOKEN
- TWITTER_ACCESS_SECRET
- RPC_URL
- LOG_FILE_PATH

Notes
- This repository is shared for monitoring development progress.
- Production deployment and final configuration are in progress.





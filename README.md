# LUX Exchange

LUX Exchange is a full-stack simulated exchange platform with real Bitcoin Testnet4 blockchain integration. It provides a portfolio-style interface for managing simulated multi-currency balances while using the public Testnet4 network for development wallet activity.

## Features

- JWT authentication
- Profile, settings, and password security
- Multi-currency simulated wallets
- Live FX and crypto rates
- Exchange transactions
- Simulated deposits and withdrawals
- Demo payment methods
- Simulated card deposits
- No full card or CVV storage
- Portfolio valuation
- Portfolio history and chart
- Bitcoin Testnet4 wallet generation
- Encrypted private keys
- QR code wallet address
- Live Testnet4 balance
- Blockchain transaction history and confirmations
- Bitcoin fee preview
- Server-side Bitcoin transaction signing
- Testnet4 transaction broadcasting

Fiat and standard wallet balances are simulated. Bitcoin integration uses Testnet4 only. No real money or mainnet BTC is supported.

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Recharts

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- JWT
- bcrypt

### Blockchain

- bitcoinjs-lib
- mempool.space Testnet4 API
- AES-256-GCM wallet-key encryption

### Infrastructure

- Docker / Docker Compose

## Architecture

The React frontend calls the Express API. Express applies authentication and domain rules, then uses Prisma to read and write PostgreSQL data. Rate services and the Bitcoin wallet services connect to external rate providers and the mempool.space Testnet4 provider. Bitcoin private keys are encrypted by the backend and signing happens server-side.

## Security

- Passwords are hashed with bcrypt.
- Protected routes require a signed JWT.
- Private Bitcoin keys are encrypted at rest with AES-256-GCM.
- Private keys are never returned to the frontend.
- Bitcoin transaction signing stays on the server.
- Demo payment methods store only non-sensitive display metadata such as brand, last4, expiry, and cardholder name.
- No full card numbers, CVV/CVC, PINs, banking credentials, or other raw payment secrets are stored.
- Mainnet support is not enabled.

## Local Setup

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Install and start the backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Install and start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open Prisma Studio:

```bash
cd backend
npx prisma studio
```

Create `backend/.env` with local values. Do not commit real secrets:

```env
DATABASE_URL=
JWT_SECRET=
WALLET_ENCRYPTION_KEY=
```

## Screens / Main Routes

- `/dashboard`
- `/exchange`
- `/deposit`
- `/withdraw`
- `/transactions`
- `/funding-history`
- `/crypto-wallets`
- `/profile`
- `/payment-methods`

## Links

- GitHub: https://github.com/mstepanenko-dev/LUX-Exchange
- Telegram: placeholder, add the real project URL when available
- X: placeholder, add the real project URL when available
- LinkedIn: placeholder, add the real project URL when available

## Disclaimer

This is an educational and portfolio project. It is not a regulated financial exchange. No real card payments are processed. Do not use it with real funds.

# Haircutz by Larry — Admin

Next.js admin dashboard for **Haircutz by Larry** (styles catalogue, appointments).

## Prerequisites

- Node 20+
- Backend running (see `haircutz-by-larry-be`)

## Environment

Create `.env.local` in this folder (never commit it):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | yes | API base URL (default `http://localhost:8080`) |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Unauthenticated visits redirect to `/login`. After login you land on **Styles**. Nav: Styles | New style | Appointments | Logout.

Seed an admin in Mongo — see `haircutz-by-larry-be/docs/admin-seed.md`.

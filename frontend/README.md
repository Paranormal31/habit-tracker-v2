# Habit Tracker Frontend

Next.js frontend for Habit Tracker V2.

## Environment
Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

For production, set this to your deployed backend URL.

## Run
```bash
npm install
npm run dev
```

## PWA
This frontend includes:
- Web manifest (`src/app/manifest.ts`)
- Service worker registration (`src/components/PwaRegister.tsx`)
- Service worker file (`public/sw.js`)
- App icons (`public/icons/*`)

After deploying over HTTPS, install from Chrome/Edge using the browser install prompt/menu.

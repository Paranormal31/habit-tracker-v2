# Habit Tracker V2

A full-stack habit tracking app with streaks, monthly progress, and a clean, focused UI.

## Features
- Auth (register, login, logout)
- Habit CRUD + reorder
- Daily completions
- Monthly progress stats
- Timezone-aware streaks

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind
- Backend: Node.js, Express, TypeScript, MongoDB

## Project Structure
- `frontend/` Next.js app
- `backend/` Express API

## Getting Started

### 1) Environment
Create env files based on the examples:
- `frontend/.env.local` (use `frontend/.env.local.example` as reference)
- `backend/.env` (use `backend/.env.example` as reference)

### 2) Install
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 3) Run
```bash
# Backend
cd backend
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Notes
- The API runs on `http://localhost:4000` by default.
- MongoDB connection string is required in `backend/.env`.
- `CORS_ORIGIN` supports a comma-separated allowlist in production.

## Production Deployment

### Backend (Render)
Use these commands in Render for the `backend/` service:
- Build: `npm install && npm run build`
- Start: `npm start`

Set environment variables:
- `PORT=4000`
- `MONGODB_URI=<atlas_connection_string>`
- `JWT_SECRET=<at least 32 random chars>`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://<your-frontend-domain>`
- `NODE_ENV=production`

### Database (MongoDB Atlas)
- Create a dedicated database user for this app.
- Add network access for your backend host.
- Use the Atlas connection string in `MONGODB_URI`.

### Frontend (Vercel)
Deploy `frontend/` and set:
- `NEXT_PUBLIC_API_BASE_URL=https://<your-render-backend-domain>`

## Install As App (PWA)
After frontend deployment over HTTPS:
1. Open the site in Chrome or Edge.
2. Use the browser's install option (address bar icon or menu).
3. Launch Habit Tracker from desktop/start menu as a standalone app window.

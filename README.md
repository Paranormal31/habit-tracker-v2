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

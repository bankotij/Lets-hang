# Let's Hang 🎉

An event discovery and hosting platform where people can create, share, and join local events.

## Project Structure

```
lets-hang/
├── backend/     → Express.js API (Node.js + MongoDB)
├── frontend/    → React + Vite + TypeScript + Tailwind
└── README.md    → You are here
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
cp config/env.example.txt .env  # Then edit with your values
npm install
npm run dev
```

Runs on http://localhost:5000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com)
2. Connect this repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables (see `backend/config/env.example.txt`)

### Frontend → Vercel

1. Import project on [Vercel](https://vercel.com)
2. Connect this repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = Your Render backend URL

---

## Features

- 🔐 Email/password authentication with OTP verification
- 📅 Create and manage events
- 🎫 Ticket tiers, add-ons, and custom questions
- 💳 Razorpay payment integration
- 🔍 Search and filter events
- 👤 User profiles

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite, Jotai |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Payments | Razorpay |
| Auth | JWT, bcrypt |

# LifeOS – Daily Activity & Goal Tracker

A full-stack web application for tracking food, workouts, and study sessions with a beautiful glassmorphism UI.

## 🚀 Tech Stack

- **Frontend**: React.js (Vite) + Tailwind CSS + Framer Motion + Recharts
- **Backend**: Node.js + Express.js + MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **PDF Reports**: PDFKit
- **Nutrition API**: Edamam / Nutritionix (auto-fetch macros)

---

## 📁 Project Structure

```
lifeos/
├── backend/
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/       # Auth middleware
│   ├── utils/           # Nutrition API helper
│   ├── server.js        # Main entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── context/     # Auth + Theme context
    │   ├── pages/       # Page components
    │   └── utils/       # API + date helpers
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── .env.example
```

---

## ⚙️ Local Setup (Mac / VSCode)

### Prerequisites
- Node.js 18+ (install via [nvm](https://github.com/nvm-sh/nvm) or [nodejs.org](https://nodejs.org))
- MongoDB Atlas account (free) OR local MongoDB

### Step 1: Clone / Open Project
Open the `lifeos/` folder in VSCode.

### Step 2: Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values (see below)
npm install
npm run dev
```

The backend will run on http://localhost:5000

### Step 3: Setup Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will run on http://localhost:5173

---

## 🔐 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lifeos
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long
JWT_EXPIRE=30d

# Nutrition API (optional - get free keys below)
EDAMAM_APP_ID=your_edamam_app_id
EDAMAM_APP_KEY=your_edamam_app_key

NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🍃 MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0 Sandbox)
3. Create a database user: Security → Database Access → Add User
4. Allow network access: Security → Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0) for development
5. Get connection string: Databases → Connect → Drivers → Copy URI
6. Replace `<username>` and `<password>` in your `.env`

---

## 🥗 Nutrition API Setup (Optional but Recommended)

### Option A: Edamam (Recommended - Free)
1. Go to [developer.edamam.com](https://developer.edamam.com)
2. Sign up and create an app under "Food Database API"
3. Copy your `App ID` and `App Key` to `.env`

### Option B: Nutritionix
1. Go to [developer.nutritionix.com](https://developer.nutritionix.com)
2. Sign up for free tier
3. Copy `App ID` and `API Key` to `.env`

> **Note**: Without API keys, LifeOS falls back to a built-in estimation table. It still works!

---

## 📄 PDF Report Generation

PDF reports are generated server-side using PDFKit.

To generate a report:
1. Go to Reports page
2. Select month and year
3. Click "Download PDF Report"
4. Optionally check "Clear data after export" to auto-delete that month's data

---

## 🔄 Data Reset / Cleanup

### Auto-cleanup (30+ days old data):
```
Reports page → Data Management → Clean Up Old Data
```

### Manual via API:
```bash
curl -X DELETE http://localhost:5000/api/report/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Reset specific month:
Generate a PDF report with "Clear data after export" checked.

---

## 🌐 Deployment

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.render.com/api`
5. Deploy!

### Backend → Render

1. Push `backend/` to a GitHub repo (or same repo, different folder)
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Root directory: `backend/`
5. Add all environment variables from `.env`
6. Deploy!

### Backend → Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo and `backend/` subfolder
4. Add environment variables
5. Railway auto-deploys on push

### Update CORS after deployment

In `backend/.env`, update:
```env
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/update | Update profile/goals |
| PUT | /api/auth/change-password | Change password |

### Food
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/food/week?date= | Get week entries |
| GET | /api/food/day/:date | Get day entry |
| POST | /api/food/nutrition-lookup | Auto-fetch nutrition |
| POST | /api/food/entry | Create/update entry |
| DELETE | /api/food/entry/:id | Delete entry |

### Workout
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workout/week | Get week entries |
| POST | /api/workout/entry | Create/update entry |
| GET | /api/workout/stats | Get statistics |
| DELETE | /api/workout/entry/:id | Delete entry |

### Study
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/study/week | Get week entries |
| POST | /api/study/entry | Create/update entry |
| GET | /api/study/stats | Get statistics |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/overview | Today + weekly summary |
| GET | /api/dashboard/trends | 30-day trend data |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/report/monthly-pdf | Download PDF |
| GET | /api/report/csv/:type | Download CSV |
| DELETE | /api/report/cleanup | Delete old data |

---

## ✨ Features Summary

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Food tracking (weekly view) | ✅ |
| Auto-fetch nutrition data | ✅ |
| Workout tracking + MET calorie calc | ✅ |
| Study session tracking | ✅ |
| Dashboard with charts | ✅ |
| PDF monthly reports | ✅ |
| CSV data export | ✅ |
| Dark/Light mode | ✅ |
| Responsive mobile-first design | ✅ |
| Glassmorphism UI | ✅ |
| Animated charts (Recharts) | ✅ |
| Framer Motion transitions | ✅ |
| Confirmation modals before delete | ✅ |
| PWA manifest | ✅ |
| Auto-clear after export | ✅ |
| 30-day data retention management | ✅ |

---

## 🛠️ Development Tips

### Run both servers at once (Mac)

Install `concurrently`:
```bash
npm install -g concurrently
```

From the root `lifeos/` folder:
```bash
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### VSCode Extensions Recommended
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- MongoDB for VS Code

---

## 📱 PWA (Progressive Web App)

LifeOS includes a PWA manifest. To add full PWA support:

1. Install vite-plugin-pwa: `npm install -D vite-plugin-pwa`
2. Add to `vite.config.js`:
```js
import { VitePWA } from 'vite-plugin-pwa'
plugins: [react(), VitePWA({ registerType: 'autoUpdate' })]
```

---

Made with ❤️ by LifeOS

# Deployment Guide — Skill Exchange Platform

## Table of Contents
1. [Option A: Railway (Recommended — Easiest)](#option-a-railway)
2. [Option B: Render](#option-b-render)
3. [Option C: Docker Compose](#option-c-docker-compose)
4. [Frontend: Expo EAS Build](#frontend-expo-eas-build)
5. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Option A: Railway

Railway is the fastest way to deploy — it handles both the backend and MySQL database.

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Click **"Deploy from GitHub Repo"** → select `skill-exchange-app-FYP`
4. Set the **root directory** to `backend`

### Step 3: Add MySQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"MySQL"**
2. Railway will automatically provision a MySQL instance
3. Click on the MySQL service → **"Variables"** tab → copy the connection values

### Step 4: Set Environment Variables

Click on your backend service → **"Variables"** tab → add:

| Variable | Value |
|----------|-------|
| `DB_HOST` | *(from Railway MySQL — `MYSQLHOST`)* |
| `DB_USER` | *(from Railway MySQL — `MYSQLUSER`)* |
| `DB_PASSWORD` | *(from Railway MySQL — `MYSQLPASSWORD`)* |
| `DB_NAME` | *(from Railway MySQL — `MYSQLDATABASE`)* |
| `DB_PORT` | *(from Railway MySQL — `MYSQLPORT`)* |
| `JWT_SECRET` | *(generate: run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)* |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` |

**Tip:** Railway lets you reference other service variables. You can use:
```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_PORT=${{MySQL.MYSQLPORT}}
```

### Step 5: Deploy

Railway auto-deploys when you push to GitHub. The server will:
1. Install dependencies
2. Auto-initialize all 8 database tables
3. Create the admin user
4. Start listening on the assigned port

### Step 6: Get Your Backend URL

Your backend will be available at: `https://your-app.up.railway.app`

Test it: `https://your-app.up.railway.app/api/health`

---

## Option B: Render

### Step 1: Create Web Service

1. Go to [render.com](https://render.com) → **"New Web Service"**
2. Connect your GitHub repo
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

### Step 2: Add MySQL (External)

Render doesn't have MySQL — use one of these free providers:

| Provider | Free Tier | Link |
|----------|-----------|------|
| **Aiven** | 5GB MySQL | [aiven.io](https://aiven.io) |
| **PlanetScale** | 5GB (MySQL-compatible) | [planetscale.com](https://planetscale.com) |
| **TiDB Cloud** | 5GB | [tidbcloud.com](https://tidbcloud.com) |

### Step 3: Set Environment Variables

In Render dashboard → **"Environment"** tab, add the same variables as Railway (Step 4 above), using connection details from your MySQL provider.

### Step 4: Deploy

Render auto-deploys on push. Your URL will be: `https://your-app.onrender.com`

---

## Option C: Docker Compose

For self-hosted deployment (VPS, AWS EC2, DigitalOcean, etc.):

### Step 1: Set Environment Variables

Create a `.env` file in the project root:

```env
DB_PASSWORD=your_strong_password_here
DB_NAME=skill_exchange
JWT_SECRET=your_strong_jwt_secret_here
CORS_ORIGIN=*
```

### Step 2: Build and Run

```bash
docker-compose up -d --build
```

This starts:
- **MySQL** on port 3307 (external) / 3306 (internal)
- **Backend** on port 5000

### Step 3: Verify

```bash
curl http://localhost:5000/api/health
```

### Step 4: Seed Data (Optional)

```bash
docker-compose exec backend node seedDatabase.js
```

---

## Frontend: Expo EAS Build

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Log in to Expo

```bash
eas login
```

### Step 3: Update the API URL

Edit `services/api.js` and set `PRODUCTION_API_URL` to your deployed backend:

```javascript
const PRODUCTION_API_URL = "https://your-app.up.railway.app";
```

### Step 4: Build for Android (APK for testing)

```bash
cd skill-exchange-wireframe
eas build --platform android --profile preview
```

This builds an `.apk` file you can install directly on any Android device.

### Step 5: Build for iOS (requires Apple Developer Account — $99/year)

```bash
eas build --platform ios --profile preview
```

### Step 6: Build for Production (App Store / Play Store)

```bash
# Android (produces .aab for Play Store)
eas build --platform android --profile production

# iOS (produces .ipa for App Store)
eas build --platform ios --profile production
```

### Step 7: Web Deployment (Optional)

```bash
npx expo export:web
```

Deploy the `web-build/` folder to **Netlify**, **Vercel**, or **GitHub Pages**:

```bash
# Netlify
npx netlify deploy --prod --dir=web-build

# Vercel
cd web-build && npx vercel --prod
```

---

## Post-Deployment Checklist

### Security

- [ ] Generate a strong `JWT_SECRET` (at least 64 characters)
- [ ] Set `CORS_ORIGIN` to your specific frontend URL (not `*`)
- [ ] Set `NODE_ENV=production`
- [ ] Ensure `.env` is NOT committed to git
- [ ] Use HTTPS (Railway/Render provide this automatically)
- [ ] Change default admin password after first login

### Database

- [ ] Verify all 8 tables are created (check server logs)
- [ ] Admin user created: `K2355109@KINGSTON.AC.UK` / `admin123`
- [ ] (Optional) Run `node seedDatabase.js` for demo data

### Testing

- [ ] Health check: `GET /api/health` returns 200
- [ ] Register a new user with `@kingston.ac.uk` email
- [ ] Login and verify JWT token works
- [ ] Create a service listing
- [ ] Send a chat message
- [ ] Test admin dashboard access

### Mobile App

- [ ] Update `PRODUCTION_API_URL` in `services/api.js`
- [ ] Build APK with `eas build --platform android --profile preview`
- [ ] Install APK on test device
- [ ] Verify all features work with production backend

---

## Quick Reference

| Component | Local | Production |
|-----------|-------|------------|
| Backend | `http://localhost:5000` | `https://your-app.up.railway.app` |
| Frontend (Web) | `http://localhost:8081` | Deploy `web-build/` to Netlify/Vercel |
| Frontend (Mobile) | Expo Go app | APK/IPA via EAS Build |
| Database | `localhost:3306` | Railway MySQL / Aiven / PlanetScale |
| Health Check | `localhost:5000/api/health` | `your-app.up.railway.app/api/health` |

# Skill Exchange App - Setup Guide

## Prerequisites

Install the following on your computer:

1. **Node.js** (v18+) → https://nodejs.org/
2. **MySQL** (v8+) → https://dev.mysql.com/downloads/installer/
   - During setup, set root password (or leave blank for no password)
   - Make sure MySQL service is running
3. **Expo Go** app on your phone → App Store (iOS) / Play Store (Android)

---

## Step 1: Install Dependencies

Open a terminal in the project folder and run:

```bash
# Install frontend dependencies
cd skill-exchange-wireframe
npm install

# Install backend dependencies
cd backend
npm install
```

---

## Step 2: Configure the Database

1. Copy the example environment file:
   ```bash
   cd backend
   copy .env.example .env       # Windows
   # OR
   cp .env.example .env         # Mac/Linux
   ```

2. Edit `.env` and set your MySQL password:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=skill_exchange
   DB_PORT=3306
   PORT=5000
   JWT_SECRET=any_random_string_here
   ```

3. Initialize the database tables:
   ```bash
   cd backend
   npm run init-db
   ```

4. (Optional) Seed with sample data:
   ```bash
   npm run seed-db
   ```

---

## Step 3: Set Your IP Address

Find your computer's local IP:
- **Windows**: Open CMD and type `ipconfig` → look for **IPv4 Address** (e.g., `192.168.1.5`)
- **Mac**: Open Terminal and type `ifconfig | grep inet` → look for `192.168.x.x`

Then edit the file `services/api.js` and change this line:

```javascript
const SERVER_IP = '192.168.x.x';  // ← Put YOUR IP here
```

> **IMPORTANT**: Your phone and computer must be on the **same Wi-Fi network**.

---

## Step 4: Start the App

### Terminal 1 – Start Backend:
```bash
cd skill-exchange-wireframe/backend
npm start
```
You should see:
```
🚀 Server running on port 5000
✅ MySQL Database Connected
```

### Terminal 2 – Start Frontend (Expo):
```bash
cd skill-exchange-wireframe
npx expo start --tunnel
```

Wait for the QR code to appear.

---

## Step 5: Open on Your Phone

1. Open **Expo Go** on your phone
2. **Scan the QR code** shown in Terminal 2
   - iOS: Use the Camera app
   - Android: Use Expo Go's scanner
3. The app will load on your phone

---

## Login Credentials (if database was seeded)

| Email | Password | Role |
|-------|----------|------|
| admin@university.edu | admin123 | Admin |
| john@university.edu | password123 | Student |
| jane@university.edu | password123 | Student |

---

## Troubleshooting

### "No response from server"
- Make sure the backend is running (`npm start` in backend folder)
- Check that your IP address is correct in `services/api.js`
- Make sure phone and computer are on the **same Wi-Fi**
- On Windows, allow Node.js through the firewall when prompted

### "Database connection failed"
- Make sure MySQL is running
- Check your `.env` file has the correct password
- Run `npm run init-db` to create the tables

### QR code doesn't work
- Try `npx expo start --tunnel` (uses ngrok tunnel)
- Make sure Expo Go is installed and up to date

### App crashes on load
- Run `npm install` again in both root and backend folders
- Clear Expo cache: `npx expo start --clear`

# API Integration Guide

## ✅ What's Connected

The frontend React Native app is now **fully connected** to the backend API!

### Connected Features:
- ✅ **User Registration** - Creates real users in MySQL database
- ✅ **User Login** - Authenticates against database with JWT tokens
- ✅ **Token Storage** - JWT tokens stored securely in AsyncStorage
- ✅ **Auto-Login** - Users stay logged in between sessions
- ✅ **User Profile** - Displays real user data from database
- ✅ **Logout** - Properly clears tokens and session

## 🚀 How to Use

### 1. Start Backend Server (Terminal 1)
```bash
cd backend
node server.js
```
Backend runs on: `http://localhost:5000`

### 2. Start Frontend App (Terminal 2)
```bash
npm start
```
Frontend runs on: `http://localhost:8081`

### 3. Test the App

#### **Login with Admin:**
- Email: `ali.assi@kingston.ac.uk`
- Password: `admin123`

#### **Register New User:**
- Email must be valid (e.g., `yourname@kingston.ac.uk`)
- Password must be at least 6 characters
- User will be saved to database immediately

## 🔧 API Configuration

### Important: Update API Base URL

The API base URL is configured in `services/api.js`:

```javascript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:5000/api';

// For Physical Device (use YOUR computer's IP)
const API_BASE_URL = 'http://192.168.0.x:5000/api';
```

### How to Find Your IP Address:

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for "inet" under your active network adapter
```

Then update `services/api.js` with your IP address.

## 📦 What Was Added

### New Files Created:
1. **`services/api.js`** - Axios instance with interceptors
2. **`services/authService.js`** - Authentication API calls
3. **`contexts/AuthContext.js`** - Global auth state management

### Files Updated:
1. **`App.js`** - Wrapped with AuthProvider
2. **`screens/LoginScreen.js`** - Real API login
3. **`screens/RegistrationScreen.js`** - Real API registration
4. **`screens/ProfileScreen.js`** - Display real user data
5. **`screens/AdminDashboardScreen.js`** - Display real admin data

### Packages Installed:
- `axios` - HTTP client for API calls
- `@react-native-async-storage/async-storage` - Secure token storage

## 🔐 How Authentication Works

1. **User logs in** → API validates credentials
2. **Backend returns JWT token** → Stored in AsyncStorage
3. **All API requests** → Include JWT token in Authorization header
4. **Token expires/invalid** → User automatically logged out
5. **User data cached** → Fast app startup

## 🧪 Testing the Integration

### Test Registration:
1. Open app in Expo Go
2. Click "Sign Up"
3. Fill in form with valid data
4. Submit → Check database with `npm run view-db`
5. New user should appear in database!

### Test Login:
1. Use credentials you just registered
2. Or use admin: `ali.assi@kingston.ac.uk` / `admin123`
3. Check Profile screen → Should show your actual data

### Test Logout:
1. Click "Log Out" button
2. Should return to login screen
3. Token removed from storage

## 📊 View Database

To see all data saved:
```bash
cd backend
npm run view-db
```

This shows all users, services, transactions, etc.

## 🐛 Troubleshooting

### "Network Error" or "Cannot connect"
- ✅ Backend server is running on port 5000
- ✅ API_BASE_URL is correct for your device type
- ✅ Firewall allows connections on port 5000

### "401 Unauthorized"
- Token expired → Just login again
- Token will be automatically added to requests

### "User already exists"
- Email is already registered
- Try different email or login instead

### App crashes on startup
- Check if backend server is running
- Check API_BASE_URL configuration
- Try restarting Expo dev server

## 🎯 Next Steps

You can now connect other features to the backend:
- **Services CRUD** (Create/Read/Update/Delete services)
- **Real-time Chat** (Socket.IO already configured in backend)
- **Transactions & Credits** (Service exchanges)
- **Reviews & Ratings** (User feedback)
- **Admin Features** (User management, reports)

All the API endpoints are ready in the backend! Just need to create the service files (similar to `authService.js`) and call them from the screens.

## 📝 API Endpoints Available

All endpoints are documented in `backend/README.md`:
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/services/*` - Service listings
- `/api/transactions/*` - Exchanges
- `/api/reviews/*` - Ratings
- `/api/chat/*` - Messaging
- `/api/admin/*` - Admin functions

Backend server is fully functional and waiting for your requests! 🚀

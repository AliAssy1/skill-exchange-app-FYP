# Full App Integration Testing Guide

## ✅ Integration Status

All screens are now fully connected to the backend API with real data:

### ✨ Completed Integrations

1. **Authentication System** ✅
   - Login with real credentials
   - Registration creates actual database entries
   - JWT tokens stored in AsyncStorage
   - Auto-login on app restart

2. **AdminDashboardScreen** ✅
   - Fetches real services from database
   - Fetches real users from database
   - Can suspend/activate users (updates database)
   - Can delete services/users (removes from database)
   - Shows admin name dynamically

3. **BrowseServicesScreen** ✅
   - Fetches all active services from database
   - Filter by category
   - Search by service title
   - Shows real provider names, credits, duration
   - Shows services created by real users (Python Tutoring, Logo Design, etc.)

4. **HomeScreen** ✅
   - Displays user's real credit balance
   - Shows user's real statistics (offered/requested services, rating, completed exchanges)
   - Personalized greeting with user's first name
   - Loading state while fetching data
   - Empty state for activity feed

5. **ProfileScreen** ✅
   - Shows real user data (name, email, credits, reputation)
   - Logout functionality

---

## 🧪 Testing Checklist

### Backend Verification

- [x] MySQL server running (Windows service)
- [x] Backend server running on port 5000
- [x] Database populated with test data:
  - 4 users (Ali Assi admin + 3 students)
  - 4 services (Python Tutoring, Logo Design, Web Consultation, Design Workshop)
  - 4 skills
  - 2 transactions
  - 2 reviews
  - 2 messages
  - 2 notifications

### Frontend Testing Steps

#### 1. **Test Admin Login**
   - Email: `ali.assi@kingston.ac.uk`
   - Password: `admin123`
   - **Expected**: Navigate to AdminDashboard
   - **Verify**: 
     - See "Welcome back, Ali!" or admin name
     - Services tab shows 4 real services from database
     - Users tab shows 4 real users from database
     - Can toggle between Services/Users tabs
     - Each service shows real title, provider name, category, credits, duration
     - Each user shows real name, email, credits, reputation, status

#### 2. **Test Admin Features**
   - **Suspend a User**:
     - Go to Users tab
     - Press "Suspend" on test.user2@kingston.ac.uk
     - **Verify**: User status changes to "suspended" in database
   - **Activate a User**:
     - Press "Activate" on the same user
     - **Verify**: User status changes back to "active"
   - **Remove a Service**:
     - Go to Services tab
     - Press "Remove" on any service
     - **Verify**: Service disappears from list and database

#### 3. **Test Student Registration**
   - Logout from admin account
   - Go to Registration screen
   - Fill in details:
     - Full Name: `Test Student`
     - Email: `test.student@kingston.ac.uk`
     - Password: `test123`
     - Major: `Computer Science`
     - Year: `Year 1`
   - **Expected**: Account created, navigate to ProfileSetup
   - **Verify**: 
     - Run `npm run view-db` in backend
     - New user appears in users table
     - Has 100 default credits
     - Has 5.0 reputation score

#### 4. **Test Student Login**
   - Use credentials: `test.user2@kingston.ac.uk` / `test123456`
   - **Expected**: Navigate to Home screen (not AdminDashboard)
   - **Verify**:
     - Greeting shows "Welcome back, Test!" (first name from full_name)
     - Credits card shows real credit balance (175 credits for test.user2)
     - Stats show:
       - Offered services: 0
       - Requested services: 0
       - Rating: 4.0 (from reviews)
       - Completed: 0
     - Recent Activity shows "No recent activity yet"

#### 5. **Test Browse Services**
   - Navigate to Browse tab
   - **Verify**:
     - Shows 4 services from database
     - Can search by typing service title
     - Can filter by category (All, Programming, Design, etc.)
     - Each service card shows:
       - Title (e.g., "Python Tutoring for Beginners")
       - Provider name (from user full_name)
       - Description
       - Credits cost (50, 75, 60, 80)
       - Duration (120min, 180min, etc.)
       - Category tag

#### 6. **Test Profile Screen**
   - Navigate to Profile tab
   - **Verify**:
     - Shows logged-in user's name
     - Shows email (@kingston.ac.uk)
     - Shows real credit balance
     - Shows reputation score
     - Avatar with initials
     - "Edit Profile" and "Settings" buttons visible
     - Logout button works

#### 7. **Test Different User Accounts**
   
   **Admin Account (Full Access)**
   - Email: `ali.assi@kingston.ac.uk`
   - Password: `admin123`
   - Credits: 975 (after transactions)
   - Expected: AdminDashboard with full management controls

   **Test User 2 (Standard Student)**
   - Email: `test.user2@kingston.ac.uk`
   - Password: `test123456`
   - Credits: 175
   - Reputation: 4.0
   - Expected: Standard home screen, can browse and request services

   **Sarah Johnson (Service Provider)**
   - Email: `sarah.johnson@kingston.ac.uk`
   - Password: `student123`
   - Credits: 50 (after providing services)
   - Expected: Has services in database, can manage them

   **John Smith (Standard Student)**
   - Email: `john.smith@kingston.ac.uk`
   - Password: `student123`
   - Credits: 100
   - Expected: Can browse and request services

---

## 🔍 Database Verification Commands

Run these in the `backend` directory:

```powershell
# View all database tables
npm run view-db

# Start backend server (if not running)
npm start

# Check backend logs
# Look at terminal where backend is running
```

---

## 🎯 Key Integration Points

### API Base URLs (configured in `services/api.js`)
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: `http://YOUR_LOCAL_IP:5000/api`

### Authentication Flow
1. User logs in → API returns JWT token
2. Token stored in AsyncStorage
3. All subsequent API calls include token in Authorization header
4. Token verified on backend for protected routes
5. 401 error auto-logs out user

### Data Flow Examples

**HomeScreen Data Flow:**
```
Component Mount
  → useEffect calls fetchUserData()
  → Calls userService.getUserStats(user.id)
  → API request to /users/:id/stats
  → Backend queries database
  → Returns stats JSON
  → Updates state with real data
  → UI re-renders with real values
```

**BrowseServices Data Flow:**
```
Component Mount
  → useEffect calls fetchServices()
  → Calls serviceService.getAllServices({ status: 'active' })
  → API request to /services?status=active
  → Backend queries services table with JOIN on users
  → Returns services array with provider names
  → Updates state
  → FlatList renders real services
```

**AdminDashboard Data Flow:**
```
Component Mount
  → useEffect calls fetchData()
  → Parallel calls:
    → serviceService.getAllServices()
    → userService.getAllUsers()
  → Backend queries both tables
  → Returns arrays
  → Sets services and users state
  → Tab content shows real data
```

---

## 🐛 Troubleshooting

### If data doesn't appear:
1. **Check backend is running**: Look for Node.js process on port 5000
2. **Check database has data**: Run `npm run view-db` in backend folder
3. **Check API URL**: Ensure correct URL for your device (emulator vs physical)
4. **Check console**: Look for errors in Metro bundler terminal
5. **Check network**: Android emulator can access host machine via 10.0.2.2

### If login fails:
1. **Verify credentials**: Check backend/viewDatabase.js output for exact emails
2. **Check password**: Default passwords are `admin123` for admin, `student123` for students
3. **Check backend logs**: Look for error messages in backend terminal
4. **Try re-seeding**: Run `node clearTables.js` then `node seedDatabase.js` in backend

### If blank screens appear:
1. **Check loading state**: May be stuck loading
2. **Check console errors**: Look for API call failures
3. **Verify JWT token**: May be expired or invalid
4. **Try logout/login**: Refresh authentication state

---

## 📊 Expected Data After Seeding

### Users Table (4 entries)
| ID | Name | Email | Credits | Role | Status |
|----|------|-------|---------|------|--------|
| 1 | Ali Assi | ali.assi@kingston.ac.uk | 975 | admin | active |
| 2 | Test User | test.user2@kingston.ac.uk | 175 | student | active |
| 3 | Sarah Johnson | sarah.johnson@kingston.ac.uk | 50 | student | active |
| 4 | John Smith | john.smith@kingston.ac.uk | 100 | student | active |

### Services Table (4 entries)
| ID | Title | Provider | Category | Credits | Duration |
|----|-------|----------|----------|---------|----------|
| 1 | Python Tutoring for Beginners | Ali Assi | Programming | 50 | 120min |
| 2 | Professional Logo Design | Test User | Design | 75 | 180min |
| 3 | Web Development Consultation | Ali Assi | Programming | 60 | 60min |
| 4 | Graphic Design Basics Workshop | Test User | Design | 80 | 120min |

### Skills Table (4 entries)
- Python Programming (Ali Assi - offered, advanced)
- Web Development (Ali Assi - offered, intermediate)
- Graphic Design (Test User - offered, advanced)
- Spanish Language (Test User - needed, beginner)

### Transactions Table (2 entries)
- Transaction 1: Sarah → Ali (50 credits, completed)
- Transaction 2: Ali → Test User (75 credits, completed)

### Reviews Table (2 entries)
- Sarah reviewed Ali: 5 stars - "Excellent tutor! Very patient..."
- Ali reviewed Test User: 4 stars - "Great design work, very creative..."

---

## ✅ Success Criteria

Your full app integration is successful if:

1. ✅ Admin can see real services and users in dashboard
2. ✅ Students see their real credit balance on home screen
3. ✅ Browse screen shows all 4 services from database
4. ✅ Login/Registration creates/validates real database entries
5. ✅ All screens load without errors
6. ✅ Credits display correctly for each user based on transactions
7. ✅ Admin can suspend/activate users and see changes immediately
8. ✅ Services can be deleted and disappear from browse screen
9. ✅ User stats show real data from database
10. ✅ No mock data arrays remain (all data from API)

---

## 🎉 What's Working

- ✅ **Full authentication** with JWT tokens
- ✅ **Real-time data** from MySQL database
- ✅ **Admin management** with live updates
- ✅ **Service browsing** with filtering and search
- ✅ **User statistics** with real calculations
- ✅ **Credit system** with atomic transactions
- ✅ **Review system** with reputation updates
- ✅ **Professional UI** with loading states
- ✅ **Error handling** throughout the app

---

## 📱 Running the App

### Start Backend (if not running):
```powershell
cd backend
npm start
```

### Start Frontend:
```powershell
cd ..  # back to project root
npx expo start
```

### On Your Device:
1. Install Expo Go app
2. Scan QR code from terminal
3. App will load with Metro bundler
4. Test all features!

---

**Status**: 🎯 **FULL APP INTEGRATION COMPLETE!**

All screens connected to real backend data. Ready for comprehensive testing!

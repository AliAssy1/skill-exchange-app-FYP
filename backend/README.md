# Skill Exchange Backend API

Complete Node.js + Express + MySQL backend for the Skill Exchange Platform with real-time chat using Socket.IO.

## 🚀 Features

- ✅ User Authentication & Authorization (JWT)
- ✅ User Profile Management
- ✅ Service Listings (CRUD)
- ✅ Transaction/Exchange Management
- ✅ Credit System
- ✅ Reviews & Ratings
- ✅ Real-time Chat (Socket.IO)
- ✅ Admin Dashboard
- ✅ Notifications System
- ✅ Reporting & Moderation

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skill_exchange
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:8081
```

### 3. Initialize Database

This will create the database, tables, and admin user:

```bash
npm run init-db
```

**Default Admin Credentials:**
- Email: ali.assi@kingston.ac.uk
- Password: admin123

### 4. Start Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # MySQL connection pool
│   └── initDatabase.js      # Database initialization script
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── serviceController.js # Service listings
│   ├── transactionController.js # Exchanges
│   ├── reviewController.js  # Reviews & ratings
│   ├── chatController.js    # Chat messages
│   └── adminController.js   # Admin operations
├── middleware/
│   ├── authMiddleware.js    # JWT verification
│   └── errorMiddleware.js   # Error handling
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── serviceRoutes.js
│   ├── transactionRoutes.js
│   ├── reviewRoutes.js
│   ├── chatRoutes.js
│   └── adminRoutes.js
├── socket/
│   └── chatSocket.js        # Socket.IO real-time chat
├── .env.example
├── package.json
└── server.js                # Main server file
```

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/:id` | Get user profile | Public |
| GET `/api/users/:id/stats` | Get user stats | Public |
| PUT | `/api/users/profile` | Update profile | Private |
| POST | `/api/users/skills` | Update skills | Private |
| GET | `/api/users/search?q=query` | Search users | Private |

### Services

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/services` | Get all services | Public |
| GET | `/api/services/:id` | Get single service | Public |
| GET | `/api/services/user/:userId` | Get user's services | Public |
| POST | `/api/services` | Create service | Private |
| PUT | `/api/services/:id` | Update service | Private |
| DELETE | `/api/services/:id` | Delete service | Private |

### Transactions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/transactions` | Request service | Private |
| GET | `/api/transactions` | Get user transactions | Private |
| GET | `/api/transactions/:id` | Get transaction details | Private |
| PUT | `/api/transactions/:id/status` | Update status | Private |

### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reviews` | Create review | Private |
| GET | `/api/reviews/user/:userId` | Get user reviews | Public |
| GET | `/api/reviews/transaction/:id` | Get transaction reviews | Private |

### Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/chat/conversations` | Get conversations | Private |
| GET | `/api/chat/messages/:userId` | Get messages with user | Private |
| POST | `/api/chat/messages` | Send message | Private |
| PUT | `/api/chat/messages/read/:userId` | Mark as read | Private |
| GET | `/api/chat/unread` | Get unread count | Private |

### Admin (Admin Only)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/stats` | Dashboard statistics | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| PUT | `/api/admin/users/:id/status` | Update user status | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/services` | Get all services | Admin |
| DELETE | `/api/admin/services/:id` | Delete service | Admin |
| GET | `/api/admin/reports` | Get all reports | Admin |
| PUT | `/api/admin/reports/:id` | Update report | Admin |

## 🔌 Socket.IO Events

### Client → Server

- `user_online` - User comes online
- `send_message` - Send chat message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `mark_as_read` - Mark messages as read
- `get_online_users` - Get list of online users

### Server → Client

- `receive_message` - Receive new message
- `message_sent` - Message sent confirmation
- `user_typing` - Another user is typing
- `user_stop_typing` - Another user stopped typing
- `messages_read` - Messages were read
- `user_status_change` - User online/offline status
- `online_users` - List of online users

## 📊 Database Schema

### Tables

- **users** - User accounts and profiles
- **skills** - User skills (offered/needed)
- **services** - Service listings
- **transactions** - Service exchanges
- **reviews** - User reviews and ratings
- **messages** - Chat messages
- **notifications** - User notifications
- **reports** - Moderation reports

## 🔒 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Example API Usage

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@kingston.ac.uk",
    "password": "password123",
    "full_name": "John Doe",
    "major": "Computer Science",
    "year_of_study": "Third Year"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@kingston.ac.uk",
    "password": "password123"
  }'
```

### Create Service (Authentication required)

```bash
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Python Tutoring",
    "description": "Learn Python basics",
    "category": "Programming",
    "credits_cost": 50,
    "duration_minutes": 60
  }'
```

## 🧪 Testing

Test the API health:

```bash
curl http://localhost:5000/api/health
```

## 🚨 Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## 📦 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Socket.IO** - Real-time communication
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## 🔧 Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Initialize/Reset database
npm run init-db
```

## 📄 License

MIT

## 👥 Support

For issues or questions, please open an issue in the repository.

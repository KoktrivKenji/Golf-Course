# Online Golf Booking System

A full-stack web application for booking golf tee times with features like user authentication, real-time tee time management, and an AI-powered chatbot assistant.

## Features

- 🔐 User Authentication (Register/Login)
- 📅 Real-time Tee Time Booking
- 🤖 AI Chat Assistant
- 👤 User Profile Management
- 📱 Responsive Design
- 🔒 Secure JWT Authentication

## Tech Stack

### Backend
- Node.js & Express.js
- MySQL with Sequelize ORM
- JWT Authentication
- Google Gemini AI API
- bcrypt for password hashing

### Frontend
- HTML5, CSS3, JavaScript
- Responsive Design
- RESTful API Integration

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd online-golf-booking
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (if separate)
cd ../online-golf-booking
npm install
```

3. Configure environment variables:
Create a `.env` file in the backend directory with:

4. Initialize the database:
```bash
# Run database migrations
mysql -u root -p < backend/database/migrations/schema.sql

# Seed initial data
node backend/seeders/teeTimeSeeder.js
```

5. Start the application:
```bash
# Start backend server
cd backend
npm run dev

# Start frontend (if separate)
cd online-golf-booking
npm start
```

## API Endpoints
```bash
# Authentication
POST /api/register - Register new user
POST /auth/login - User login
POST /auth/logout - User logout

# Tee Times
GET /api/tee-times/:course/:holes - Get available tee times
POST /api/bookings - Create a booking
GET /api/my-bookings - Get user's bookings
```
```bash
# User Profile
GET /api/current-user - Get current user profile
POST /api/update-profile - Update user profile

# AI Assistant
POST /api/chat - Interact with AI chatbot
```


## Testing
```bash
# Run system tests:
cd backend
node tests/systemTest.js
 ```

```bash
## Security Features
JWT Authentication
Password Hashing
Rate Limiting
CORS Protection
Input Validation
Secure Headers


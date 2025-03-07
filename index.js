const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Add error handling middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`); // Log all requests
  next();
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).send({
    status: 404,
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    status: 500,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Session middleware
app.use(session({
  secret: 'golf-booking-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

// In-memory database for demonstration
const users = [];
const bookings = [];
const teeTimeSlots = [
  { id: 1, course: "Pine Valley", holes: "9H", time: "07:00", date: "2025-06-01", available: true },
  { id: 2, course: "Pine Valley", holes: "9H", time: "08:00", date: "2025-06-01", available: true },
  { id: 3, course: "Pine Valley", holes: "18H", time: "09:00", date: "2025-06-01", available: true },
  { id: 4, course: "Augusta National", holes: "18H", time: "07:30", date: "2025-06-01", available: true },
  { id: 5, course: "Augusta National", holes: "9H", time: "10:00", date: "2025-06-01", available: true },
  { id: 6, course: "St Andrews", holes: "18H", time: "08:30", date: "2025-06-01", available: true },
  { id: 7, course: "St Andrews", holes: "9H", time: "11:00", date: "2025-06-01", available: true },
  { id: 8, course: "Pebble Beach", holes: "18H", time: "09:30", date: "2025-06-01", available: true }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Please login to continue' });
  }
};

// Get tee times
app.get('/api/tee-times', (req, res) => {
  res.json({ success: true, teeTimeSlots });
});

// Get tee times by course and holes
app.get('/api/tee-times/:course/:holes', (req, res) => {
  const { course, holes } = req.params;
  const filteredTimes = teeTimeSlots.filter(
    slot => slot.course === course && slot.holes === holes
  );
  res.json({ success: true, teeTimeSlots: filteredTimes });
});

// Booking API endpoint
app.post('/bookings', isAuthenticated, (req, res) => {
  const { teeTimeId, players } = req.body;
  const userId = req.session.user.id;
  
  // Find the tee time
  const teeTimeIndex = teeTimeSlots.findIndex(slot => slot.id === parseInt(teeTimeId));
  
  if (teeTimeIndex === -1) {
    return res.status(404).json({ success: false, message: 'Tee time not found' });
  }
  
  if (!teeTimeSlots[teeTimeIndex].available) {
    return res.status(400).json({ success: false, message: 'This tee time is already booked' });
  }
  
  // Mark as booked
  teeTimeSlots[teeTimeIndex].available = false;
  
  // Create booking
  const booking = {
    id: bookings.length + 1,
    userId,
    teeTime: teeTimeSlots[teeTimeIndex],
    players,
    bookingDate: new Date().toISOString()
  };
  
  bookings.push(booking);
  
  // Send back the booking details
  res.json({ success: true, message: 'Booking confirmed!', booking });
});

// Get user bookings
app.get('/api/my-bookings', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const userBookings = bookings.filter(booking => booking.userId === userId);
  res.json({ success: true, bookings: userBookings });
});

// Authentication endpoints
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  
  // Store user in session
  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username
  };
  
  res.json({ 
    success: true, 
    message: 'Login Successful!',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      profilePicture: user.profilePicture
    }
  });
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Registration endpoint
app.post('/api/register', (req, res) => {
  const { name, username, phone, email, password } = req.body;
  
  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    username,
    phone,
    email,
    password,
    profilePicture: null
  };
  
  users.push(newUser);
  
  // Auto login after registration
  req.session.user = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    username: newUser.username
  };
  
  res.json({ success: true, message: 'Registration successful!', user: newUser });
});

// Update profile
app.post('/api/update-profile', isAuthenticated, upload.single('profilePicture'), (req, res) => {
  const { name, phone, email } = req.body;
  const userId = req.session.user.id;
  
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  // Update user details
  if (name) users[userIndex].name = name;
  if (phone) users[userIndex].phone = phone;
  if (email) users[userIndex].email = email;
  
  // Update profile picture if uploaded
  if (req.file) {
    users[userIndex].profilePicture = `/uploads/${req.file.filename}`;
  }
  
  res.json({ 
    success: true, 
    message: 'Profile updated successfully',
    user: {
      id: users[userIndex].id,
      name: users[userIndex].name,
      email: users[userIndex].email,
      phone: users[userIndex].phone,
      profilePicture: users[userIndex].profilePicture
    }
  });
});

// Get current user
app.get('/api/current-user', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      profilePicture: user.profilePicture
    }
  });
});

// Chatbot API endpoint
app.post('/', (req, res) => {
  const { prompt } = req.body;
  
  // In a real app, you would integrate with an AI service
  console.log('Chatbot prompt:', prompt);
  
  // Mock AI response
  let response = "Thanks for your message! I'm your golf assistant. ";
  
  if (prompt.toLowerCase().includes('book')) {
    response += "You can book a golf course by visiting our booking page.";
  } else if (prompt.toLowerCase().includes('course')) {
    response += "We have several beautiful courses available for booking.";
  } else {
    response += "How can I help you with your golfing needs today?";
  }
  
  res.json({ response });
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
});
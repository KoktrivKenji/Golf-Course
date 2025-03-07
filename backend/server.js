const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Add this import
const { User, TeeTime, Booking, sequelize } = require('./models');
require('dotenv').config();
const fs = require('fs'); // Add this import
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Add logging
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working' });
});

// Routes

// Register new user
app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('username').notEmpty(),
  body('phone').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { email, password, name, username, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        errors: [{
          msg: existingUser.email === email ? 'Email already in use' : 'Username already taken'
        }]
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      phone
    });

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
      errors: error.errors || []
    });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login Successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// Logout
app.post('/auth/logout', authenticateUser, async (req, res) => {
  try {
    // No specific logout logic needed for JWT
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
app.get('/api/current-user', authenticateUser, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update profile - improve file upload handling
app.post('/api/update-profile', authenticateUser, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    let profilePictureUrl = null;

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(__dirname, 'public/uploads', fileName);
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, 'public/uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'public/uploads'), { recursive: true });
      }
      
      // Save file
      fs.writeFileSync(filePath, req.file.buffer);
      profilePictureUrl = `/uploads/${fileName}`;
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.name = name;
    user.email = email;
    user.phone = phone;
    if (profilePictureUrl) {
      user.profilePicture = profilePictureUrl;
    }
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get tee times
app.get('/api/tee-times/:course/:holes', authenticateUser, async (req, res) => {
  try {
    const { course, holes } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teeTimeSlots = await TeeTime.findAll({
      where: {
        course,
        holes,
        available: true,
        date: {
          [Op.gte]: today
        }
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC']
      ]
    });

    res.json({
      success: true,
      teeTimeSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create booking - fix the route to match frontend
app.post('/api/bookings', authenticateUser, async (req, res) => {  // Changed from /bookings
  try {
    const { teeTimeId, players } = req.body;
    const userId = req.user.id;
    
    console.log('Booking attempt:', {
      userId,
      teeTimeId,
      players,
      decodedToken: req.user
    });

    // First verify the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', user.id);

    const teeTime = await TeeTime.findByPk(teeTimeId);
    if (!teeTime) {
      return res.status(404).json({
        success: false,
        message: 'Tee time not found'
      });
    }

    if (!teeTime.available) {
      return res.status(400).json({
        success: false,
        message: 'Tee time not available'
      });
    }

    const booking = await sequelize.transaction(async (t) => {
      await teeTime.update({ available: false }, { transaction: t });

      const newBooking = await Booking.create({
        UserId: user.id, // Use verified user ID
        TeeTimeId: teeTimeId,
        players: players
      }, { transaction: t });

      return newBooking;
    });

    const bookingWithDetails = await Booking.findByPk(booking.id, {
      include: [
        { model: TeeTime },
        { model: User, attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({
      success: true,
      message: 'Booking successful',
      booking: bookingWithDetails
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.toString(),
      stack: error.stack
    });
  }
});

// Get user's bookings
app.get('/api/my-bookings', authenticateUser, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { UserId: req.user.id },
      include: [TeeTime],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Update chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Configure model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Generate context-aware prompt
    const enhancedPrompt = `As a golf booking assistant, help with: ${prompt}. 
                           Consider tee times, course information, and booking details in your response.`;
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response.text();
    
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your request'
    });
  }
});

// Add 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: err.message 
  });
});

// Initialize database and start server
sequelize.sync({ force: true }) // This will drop and recreate all tables
  .then(async () => {
    console.log('Database synced');
    // Create some initial tee times
    await TeeTime.create({
      course: 'Pine Valley',
      date: new Date(),
      time: '09:00:00',
      holes: '18H',
      available: true
    });
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Database sync error:', error);
  });

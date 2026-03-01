const express = require('express');
const mongoose = require('mongoose');
const path = require('path');       // ✅ only once
require('dotenv').config();

const connectDB = require('./config/db');
const cors = require('cors');

const app = express();



// -------------------------
// Connect to MongoDB
// -------------------------
connectDB();

// -------------------------
// Global CORS – allow frontend domain
// -------------------------
app.use(cors({
  origin: "https://sheratoneducationcentre.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// -------------------------
// Body parsers
// -------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// Debug logging (CORS check)
// -------------------------
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ACAO:`,
      res.getHeader('access-control-allow-origin')
    );
  });
  next();
});

// -------------------------
// Serve uploaded files (resources, homeworks, etc.)
// -------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -------------------------
// Static assets (frontend)
const publicFrontendPath = path.join(__dirname, 'frontend_public');
const pagesPath = path.join(publicFrontendPath, 'pages');

app.use(express.static(publicFrontendPath));
app.use('/css', express.static(path.join(publicFrontendPath, 'css')));
app.use('/js', express.static(path.join(publicFrontendPath, 'js')));
app.use('/images', express.static(path.join(publicFrontendPath, 'images')));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(publicFrontendPath, 'favicon.ico'), {
    headers: { 'Content-Type': 'image/x-icon' }
  });
});

// -------------------------
// API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/grades', require('./routes/gradesRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/books', require('./routes/books'));
app.use('/api/events', require('./routes/events'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/schoolUserRoutes'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/homeworks', require('./routes/homeworkRoutes'));
app.use('/api/reportcards', require('./routes/reportCardRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/library', require('./routes/library'));
app.use('/api/marks', require('./routes/marksRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/health', require('./routes/health'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/transport/fees', require('./routes/transportFees'));
app.use('/api/transport/payments', require('./routes/transportPayments'));
app.use('/api/transport/attendance', require('./routes/transportAttendance'));


// -------------------------
// FRONTEND ROUTES

// -------------------------
// FRONTEND ROUTES
// -------------------------

// Always serve login for root and /login
app.get(['/', '/'], (req, res) => {
  res.sendFile(path.join(pagesPath, 'login.html'));
});

// Admin dashboard
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'index.html'));
});

// Teacher dashboard
app.get('/teacher.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'teacher.html'));
});

// Student dashboard
app.get('/student.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'student.html'));
});

// Any other page inside /pages folder
app.get('/*.html', (req, res) => {
  const requestedPage = path.join(pagesPath, req.path);
  res.sendFile(requestedPage, (err) => {
    if (err) {
      res.sendFile(path.join(pagesPath, 'login.html'));
    }
  });
});


// -------------------------
// Start server
const PORT = process.env.PORT || 5000;
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

console.log("🧠 Connected DB name:", mongoose.connection.name);

app.get('/setup-admin', async (req, res) => {
  const bcrypt = require('bcrypt');
  const User = require('./models/User');

  try {
    const existingAdmin = await User.findOne({ email: "admin@admin.com" });
    if (existingAdmin) return res.send("Admin already exists ✅");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await new User({
      name: "Admin User",
      email: "admin@admin.com",
      role: "admin",
      password: hashedPassword
    }).save();

    res.send("✅ Admin user created successfully!");
  } catch (err) {
    res.status(500).send("❌ Error: " + err.message);
  }
});



// app.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({
  path: process.env.RENDER || process.env.NODE_ENV === 'production'
    ? '/etc/secrets/.env'
    : path.resolve(__dirname, '.env')
});

// ------------------- ROUTES -------------------
const authRoutes = require('./routes/authRoutes');
const gradeRoutes = require('./routes/gradesRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const profileRoutes = require('./routes/profileRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const clubRoutes = require('./routes/clubs');
const bookRoutes = require('./routes/books');
const eventRoutes = require('./routes/events');
const accountRoutes = require('./routes/accounts');
const statsRoutes = require('./routes/stats');
const schoolUserRoutes = require('./routes/schoolUserRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const roleRoutes = require('./routes/roles');
const quizRoutes = require('./routes/quizRoutes');
const classRoutes = require('./routes/class');
const marksRoutes = require('./routes/marksRoutes');
const userRoutes = require('./routes/userRoutes');
const feesRoutes = require('./routes/fees');
const attendanceRoutes = require('./routes/attendanceRoutes');
const transportPaymentsRoutes = require('./routes/transportPayments');


// ------------------- MIDDLEWARE -------------------
const requestLogger = require('./middleware/requestLogger');
const corsMiddleware = require('./middleware/cors');

const app = express();

// ------------------- BODY PARSERS -------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ------------------- CORS -------------------
app.use(corsMiddleware);

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl} headers:`);
    console.log('Access-Control-Allow-Origin:', res.getHeader('Access-Control-Allow-Origin'));
    console.log('Access-Control-Allow-Credentials:', res.getHeader('Access-Control-Allow-Credentials'));
  });
  next();
});

// ------------------- LOGGING -------------------
app.use(requestLogger);

// ------------------- STATIC DIRECTORIES -------------------
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');
const reportCardsDir = path.join(__dirname, '../frontend_public/uploads/report-cards');

[uploadsDir, profilePhotosDir, reportCardsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/profile-photos', express.static(profilePhotosDir));
app.use('/report-cards', express.static(reportCardsDir));
app.use('/css', express.static(path.join(__dirname, '../frontend_public/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend_public/js')));
app.use(express.static(path.join(__dirname, '../frontend_public/pages')));

// ------------------- FRONTEND ROUTES -------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_public/pages/login.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_public/pages/index.html'));
});
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_public/pages/student.html'));
});
app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_public/pages/teacher.html'));
});

// fallback for unknown frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend_public/pages/login.html'));
});

// ------------------- API ROUTES -------------------
app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', [schoolUserRoutes, userRoutes]);
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/attendance', attendanceRoutes);


// ------------------- MONGODB CONNECTION -------------------
const mongoURI = process.env.MONGODB_URI?.trim();

console.log('Using MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//<hidden>@'));

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('🧠 Connected DB name:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = app;

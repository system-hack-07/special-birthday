require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const db = require('./api/database');
const { rateLimiter } = require('./api/middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Initialize database
db.init();

// Routes
const createRoutes = require('./api/create');
const birthdayRoutes = require('./api/birthday');

app.use('/api/create', rateLimiter, createRoutes);
app.use('/api/birthday', birthdayRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/birthday/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🎉 Birthday Generator running at http://localhost:${PORT}`);
  console.log(`📁 Database: ${process.env.DB_PATH || './data/birthday.db'}`);
  console.log(`📷 Uploads: ${process.env.UPLOAD_DIR || './uploads'}`);
});

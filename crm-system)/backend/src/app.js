require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many login attempts, please try again later.' },
});

app.use(limiter);
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/users', require('./routes/user.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ErrorResponse = require('./utils/errorResponse');
const morgan = require('morgan');

// Import routes
const kurbanRoutes = require('./routes/kurban');
const authRoutes = require('./routes/auth');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create two clients: one for public operations and one for admin operations
const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Make supabase clients available to routes
app.locals.supabase = supabasePublic;
app.locals.supabaseAdmin = supabaseAdmin;

// Middleware
app.use(cors({
  origin: 'https://kurban-app-m252.vercel.app', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow necessary methods
  credentials: true // If you need to include credentials (like cookies)
}));
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kurban', kurbanRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 Error Handler
app.use((req, res, next) => {
  next(new ErrorResponse(`Route not found - ${req.originalUrl}`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err);

  // Supabase error handling
  if (err.statusCode) {
    error = new ErrorResponse(err.message, err.statusCode);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
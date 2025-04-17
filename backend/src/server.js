const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const kurbanRoutes = require('./routes/kurban');
const authRoutes = require('./routes/auth');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase client available to routes
app.locals.supabase = supabase;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/kurban', kurbanRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const kurbanRoutes = require('./src/routes/kurban');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const statusRoutes = require('./src/routes/statuses');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://your-frontend-domain.com', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow necessary methods
  credentials: true // If you need to include credentials (like cookies)
}));
app.use(express.json());

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

// Initialize both clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Make Supabase clients available to routes
app.locals.supabase = supabase;
app.locals.supabaseAdmin = supabaseAdmin;

// Routes
app.use('/api/kurban', kurbanRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statuses', statusRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
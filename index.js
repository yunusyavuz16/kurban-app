require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const kurbanRoutes = require("./src/routes/kurban");
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const statusRoutes = require("./src/routes/statuses");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("❌ Missing required Supabase environment variables");
  process.exit(1);
}

// Initialize both clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Make Supabase clients available to routes
app.locals.supabase = supabase;
app.locals.supabaseAdmin = supabaseAdmin;

// Routes
app.use("/api/kurban", kurbanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/statuses", statusRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Kurban Management System API",
    status: "running",
    version: "1.0.0",
    mode: "Supabase API",
    endpoints: {
      kurban: "/api/kurban/*",
      auth: "/api/auth/*",
      users: "/api/users/*",
      statuses: "/api/statuses/*"
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "supabase-api",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Database connection and server startup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  console.log('🚀 Starting Kurban Management System...');
  console.log('==========================================\n');

  if (isProduction || isVercel) {
    // In production/Vercel, skip Sequelize and use only Supabase API
    console.log('🔧 Production mode: Using Supabase API only');

    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('organization').select('count').limit(1);
      if (!error) {
        console.log('✅ Supabase API connection verified');
      } else {
        console.log('⚠️  Supabase API connection issue:', error.message);
      }
    } catch (supabaseError) {
      console.log('⚠️  Supabase API test failed:', supabaseError.message);
    }
  } else {
    // In development, try to use Sequelize but fall back to Supabase API
    try {
      // Only import Sequelize models in development
      const db = require("./src/models");

      console.log('🔄 Attempting direct database connection...');

      const connectionPromise = db.sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );

      await Promise.race([connectionPromise, timeoutPromise]);

      console.log('✅ Direct database connection established');
      app.locals.db = db;

      // Sync database in development mode
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database schema synchronized');

    } catch (error) {
      console.log('⚠️  Direct database connection not available');
      console.log('🔄 Switching to Supabase API mode...');

      // Test Supabase connection
      try {
        const { data, error } = await supabase.from('organization').select('count').limit(1);
        if (!error) {
          console.log('✅ Supabase API connection verified');
        } else {
          console.log('⚠️  Supabase API connection issue:', error.message);
        }
      } catch (supabaseError) {
        console.log('⚠️  Supabase API test failed:', supabaseError.message);
      }
    }
  }

  const PORT = process.env.PORT || 3001;

  // Only start server if not in Vercel (Vercel handles this automatically)
  if (!isVercel) {
    app.listen(PORT, () => {
      console.log('\n🎉 Server started successfully!');
      console.log('==================================');
      console.log(`📡 Server URL: http://localhost:${PORT}`);
      console.log(`🗄️  Database Mode: ${app.locals.db ? 'Direct Connection' : 'Supabase API'}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

      console.log('\n🧪 Test endpoints:');
      console.log(`   curl "http://localhost:${PORT}"`);
      console.log(`   curl "http://localhost:${PORT}/api/statuses/getByOrganization/MALT"`);
      console.log('==================================\n');
    });
  }
}

// Initialize the app
if (process.env.VERCEL === '1') {
  // In Vercel, just initialize Supabase connection
  console.log('🚀 Vercel deployment detected - Supabase API mode');
  (async () => {
    try {
      const { data, error } = await supabase.from('organization').select('count').limit(1);
      if (!error) {
        console.log('✅ Supabase API ready');
      }
    } catch (err) {
      console.log('⚠️  Supabase API initialization:', err.message);
    }
  })();
} else {
  // Start server normally in development
  startServer();
}

module.exports = app;

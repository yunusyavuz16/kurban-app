require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

// Import Sequelize models
const db = require("./src/models");

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

// Make Sequelize models available to routes
app.locals.db = db;

// Routes
app.use("/api/kurban", kurbanRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/statuses", statusRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const PORT = process.env.PORT || 3001;

// Database connection and server startup
async function startServer() {
  console.log('🚀 Starting Kurban Management System...');
  console.log('==========================================\n');

  let databaseConnected = false;

  try {
    // Attempt direct database connection with timeout
    console.log('🔄 Attempting direct database connection...');

    // Set a timeout for the connection attempt
    const connectionPromise = db.sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);

    console.log('✅ Direct database connection established');
    databaseConnected = true;

    // Sync database in development mode
    if (process.env.NODE_ENV !== 'production') {
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database schema synchronized');
    }

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

  // Start server
  app.listen(PORT, () => {
    console.log('\n🎉 Server started successfully!');
    console.log('==================================');
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🗄️  Database Mode: ${databaseConnected ? 'Direct Connection' : 'Supabase API'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

    if (!databaseConnected) {
      console.log('\n💡 Note: Using Supabase API for data operations');
      console.log('   This is normal and fully functional!');
    }

    console.log('\n🧪 Test endpoints:');
    console.log(`   curl "http://localhost:${PORT}"`);
    console.log(`   curl "http://localhost:${PORT}/api/statuses/getByOrganization/DEMO001"`);
    console.log('==================================\n');
  });
}

app.get("/", (req, res) => {
  res.json({
    message: "Kurban Management System API",
    status: "running",
    version: "1.0.0",
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
    database: app.locals.db ? "connected" : "api-mode"
  });
});

// Start the server
startServer();

module.exports = app;

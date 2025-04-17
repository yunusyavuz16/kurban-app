const dotenv = require('dotenv');
const path = require('path');

// Load environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables:');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

// Import and start the server
const app = require('./src/server');
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗',
    PORT: process.env.PORT || 3001
  });
});
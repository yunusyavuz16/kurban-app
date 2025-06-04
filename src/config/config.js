require('dotenv').config();

// Extract database connection details from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;

// Parse the Supabase URL to get database connection details
// Supabase URL format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Determine the correct connection parameters
// For Supabase, we can use either direct connection or pooler
const usePooler = false; // Set to false for direct connection

let host, username, port;

if (usePooler) {
  // Session pooler configuration
  host = `aws-0-eu-west-2.pooler.supabase.com`;
  username = `postgres.${projectRef}`;
  port = 5432;
} else {
  // Direct connection configuration
  host = `db.${projectRef}.supabase.co`;
  username = 'postgres';
  port = 5432;
}

const database = 'postgres';
const password = process.env.SUPABASE_DB_PASSWORD;

module.exports = {
  development: {
    username: username,
    password: password,
    database: database,
    host: host,
    port: port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 5000,
      idle: 10000
    }
  },
  test: {
    username: username,
    password: password,
    database: database,
    host: host,
    port: port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  },
  production: {
    username: username,
    password: password,
    database: database,
    host: host,
    port: port,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};
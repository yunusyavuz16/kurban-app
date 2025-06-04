# Kurban Management System - Backend API

This is the backend API for the Kurban Management System, built with Node.js, Express, and Supabase.

## 🚀 Deployment on Vercel

### Environment Variables Required

Make sure to set these environment variables in your Vercel dashboard:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

### Deployment Steps

1. Connect your repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy the project

The API will be available at: `https://your-deployment.vercel.app`

### API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/statuses/getByOrganization/:organizationCode` - Get organization statuses
- `GET /api/kurban/search/no/:organizationCode/:kurbanNo` - Search kurban by number
- `GET /api/kurban/status-history/:organizationCode/:kurbanNo` - Get status history

## 🔧 Development

### Local Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with required environment variables
4. Start development server: `npm run dev`

### Database Setup

The application uses Supabase as the primary database. In development, it can optionally use direct PostgreSQL connections, but in production it uses Supabase API exclusively.

## 📝 Notes

- The application is optimized for Vercel's serverless environment
- Uses Supabase API for all database operations in production
- Includes fallback mechanisms for development environments

## 🚀 Features

- **Organization Management**: Multi-tenant support with organization-specific data
- **User Management**: Role-based access control (Admin, Staff, Viewer)
- **Kurban Tracking**: Complete animal processing workflow
- **Status Management**: Customizable status workflow for processing stages
- **Real-time Updates**: WebSocket support for live status updates
- **RESTful API**: Complete CRUD operations for all entities
- **Database Flexibility**: Supports both Supabase API and direct PostgreSQL connections

## 🏗️ Architecture

### Database Models

1. **Organization**: Multi-tenant organizations
2. **User**: Staff and admin users with role-based permissions
3. **KurbanStatus**: Customizable processing status workflow
4. **Kurban**: Main entity representing sacrifice animals

### Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Sequelize (with fallback to Supabase API)
- **Authentication**: JWT + Supabase Auth
- **Real-time**: Server-Sent Events (SSE)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kurban-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file with the following variables:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_DB_PASSWORD=your_database_password
   JWT_SECRET=your_jwt_secret
   ```

4. **Database Setup**
   ```bash
   npm run setup
   ```

## 🔧 Configuration

### Getting Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and API Keys

### Getting Database Password

1. In your Supabase Dashboard
2. Go to Settings > Database
3. Find the "Database password" section
4. Copy or reset your database password
5. Update your `.env` file

## 🗄️ Database Schema

### Organizations Table
```sql
- id (UUID, Primary Key)
- name (String)
- code (String, Unique)
- email (String)
- phone (String)
- address (Text)
- settings (JSON)
- is_active (Boolean)
- created_at, updated_at (Timestamps)
```

### Users Table
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- role (Enum: admin, staff, viewer)
- first_name, last_name (String)
- phone (String)
- organization_id (UUID, Foreign Key)
- is_active (Boolean)
- last_login (Timestamp)
- metadata (JSON)
- created_at, updated_at (Timestamps)
```

### Kurban Statuses Table
```sql
- id (UUID, Primary Key)
- name (String)
- label (String)
- color_bg, color_text, color_border (String)
- display_order (Integer)
- organization_id (UUID, Foreign Key)
- is_active (Boolean)
- description (Text)
- created_at, updated_at (Timestamps)
```

### Kurban Table
```sql
- id (UUID, Primary Key)
- no (String)
- order_number (Integer)
- weight (Decimal)
- notes (Text)
- slaughter_time (Timestamp)
- butcher_name (String)
- package_count (Integer)
- meat_pieces (JSON)
- status_id (UUID, Foreign Key)
- organization_id (UUID, Foreign Key)
- breed, age, color, gender (Animal details)
- owner_name, owner_phone, owner_address (Owner details)
- blood_weight, hide_weight, organ_weight, net_meat_weight (Processing details)
- metadata (JSON)
- is_active (Boolean)
- created_at, updated_at (Timestamps)
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Run seeders
npm run db:seed

# Reset database (migrations + seeders)
npm run db:reset
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user info

### Organizations
- `GET /api/users/organization-code` - Get organization code

### Users
- `GET /api/users` - Get all users (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Kurban Management
- `GET /api/kurban/getByOrganization/:organizationCode` - Get kurbans by organization
- `GET /api/kurban/search/no/:organizationCode/:kurbanNo` - Search kurban by number
- `POST /api/kurban` - Create new kurban (Staff/Admin)
- `POST /api/kurban/bulk` - Bulk upload kurbans (Admin)
- `PUT /api/kurban/:id` - Update kurban (Staff/Admin)
- `DELETE /api/kurban/:id` - Delete kurban (Admin)

### Status Management
- `GET /api/statuses` - Get all statuses
- `POST /api/statuses` - Create new status (Admin)
- `PUT /api/statuses/:id` - Update status (Admin)
- `DELETE /api/statuses/:id` - Delete status (Admin)

### Real-time Updates
- `GET /api/kurban/subscribe` - SSE endpoint for real-time updates

## 🔐 Authentication & Authorization

### Roles
- **Admin**: Full access to all operations
- **Staff**: Can manage kurbans and view data
- **Viewer**: Read-only access

### JWT Authentication
The system uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔄 Real-time Features

The system supports real-time updates using Server-Sent Events (SSE). Connect to `/api/kurban/subscribe` to receive live updates when kurban statuses change.

## 🛠️ Development

### Project Structure
```
kurban-app/
├── src/
│   ├── config/          # Database configuration
│   ├── models/          # Sequelize models
│   ├── migrations/      # Database migrations
│   ├── seeders/         # Database seeders
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Authentication middleware
│   └── utils/           # Utility functions
├── .env                 # Environment variables
├── .sequelizerc        # Sequelize configuration
├── setup-database.js   # Database setup script
└── package.json
```

### Adding New Features

1. **Models**: Add new Sequelize models in `src/models/`
2. **Migrations**: Create migrations with `npx sequelize-cli migration:generate --name migration-name`
3. **Routes**: Add API routes in `src/routes/`
4. **Controllers**: Add business logic in `src/controllers/`

## 🐛 Troubleshooting

### Database Connection Issues
1. Verify your database password in `.env`
2. Check your Supabase project status
3. Ensure your IP is whitelisted in Supabase
4. Try resetting your database password

### Migration Errors
1. Check your database connection
2. Verify migration files syntax
3. Ensure proper foreign key relationships
4. Check for duplicate migrations

### Authentication Issues
1. Verify JWT secret configuration
2. Check Supabase service role key
3. Ensure proper role assignments

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Express.js Documentation](https://expressjs.com/)
- [JWT Documentation](https://jwt.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
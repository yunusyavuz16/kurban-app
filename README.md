# Kurban Management System

A full-stack web application for managing sacrificial animal processing during Eid al-Adha.

## Features

- Real-time status dashboard for TV display
- Staff panel for updating animal status
- User inquiry page for checking animal status
- Admin panel for system management
- Supabase integration for real-time updates

## Tech Stack

- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Real-time updates: Supabase Realtime

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

1. Create a new Supabase project
2. Create the following tables:

   ```sql
   -- kurban table
   create table kurban (
     id uuid default uuid_generate_v4() primary key,
     order_number integer not null,
     status text not null,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- users table
   create table users (
     id uuid default uuid_generate_v4() primary key,
     email text not null unique,
     password_hash text not null,
     role text not null
   );

   -- status_logs table
   create table status_logs (
     id uuid default uuid_generate_v4() primary key,
     kurban_id uuid references kurban(id),
     old_status text not null,
     new_status text not null,
     changed_by uuid references users(id),
     changed_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   ```

3. Enable Row Level Security (RLS) and create appropriate policies
4. Set up Supabase Auth with email/password authentication

## Usage

1. Access the TV display at `http://localhost:5173/` for the real-time dashboard
2. Staff can log in and manage animals at `http://localhost:5173/staff`
3. Users can check their animal status at `http://localhost:5173/inquiry`
4. Admins can manage the system at `http://localhost:5173/admin`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
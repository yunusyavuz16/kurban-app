const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth, adminOnly } = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const { data: user, error } = await req.app.locals.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await req.app.locals.supabase
      .from('users')
      .select('id, email, role')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (admin only)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate role
    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const { data: existingUser } = await req.app.locals.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await req.app.locals.supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          role
        }
      ])
      .select('id, email, role')
      .single();

    if (error) throw error;

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { data: users, error } = await req.app.locals.supabase
      .from('users')
      .select('id, email, role')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { error } = await req.app.locals.supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/auth');

// Public routes
router.post('/register', auth, adminOnly, register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);

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
    // First, delete from auth
    const { error: authError } = await req.app.locals.supabaseAdmin.auth.admin.deleteUser(
      req.params.id
    );

    if (authError) throw authError;

    // Then delete from users table
    const { error: dbError } = await req.app.locals.supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (dbError) throw dbError;

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
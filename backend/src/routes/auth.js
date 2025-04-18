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


// Delete user by email (admin only)
router.delete('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Deleting user with email:', email);
    // Get user ID from email
    const { data: user, error: fetchError } = await req.app.locals.supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete user from Supabase auth
    const { error: authError } = await req.app.locals.supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authError) throw authError;

    // Delete user from users table
    const { error: dbError } = await req.app.locals.supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id);

    if (dbError) throw dbError;

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
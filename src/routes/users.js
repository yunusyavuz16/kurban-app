const express = require('express');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilirken bir hata oluştu' });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    // First, fetch the user to get their email
    const { data: user, error: fetchError } = await req.app.locals.supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    console.log('user',user)

    // Delete the user from the users table
    const { error } = await req.app.locals.supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    // Now delete the user from Supabase authentication using their email
    const { error: authError } = await req.app.locals.supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authError) throw authError;

    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Kullanıcı silinirken bir hata oluştu' });
  }
});

module.exports = router;
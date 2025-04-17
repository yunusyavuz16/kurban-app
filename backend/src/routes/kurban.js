const express = require('express');
const router = express.Router();
const { auth, adminOnly, staffOnly } = require('../middleware/auth');

// Get all animals
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('kurban')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search animal by order number
router.get('/search/order/:orderNumber', async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('kurban')
      .select('*')
      .eq('order_number', parseInt(req.params.orderNumber))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Animal not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to real-time updates
router.get('/subscribe', (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const channel = req.app.locals.supabase
      .channel('kurban_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kurban' }, (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      })
      .subscribe();

    req.on('close', () => {
      req.app.locals.supabase.removeChannel(channel);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific animal
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.app.locals.supabase
      .from('kurban')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Animal not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new animal entry (staff only)
router.post('/', auth, staffOnly, async (req, res) => {
  try {
    const { order_number } = req.body;

    // Check if order number already exists
    const { data: existing, error: checkError } = await req.app.locals.supabase
      .from('kurban')
      .select('id')
      .eq('order_number', order_number)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existing) return res.status(400).json({ error: 'Order number already exists' });

    const { data, error } = await req.app.locals.supabase
      .from('kurban')
      .insert([
        {
          order_number,
          status: 'waiting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          meat_pieces: {
            leg: 0,
            arm: 0,
            chest: 0,
            back: 0,
            ground: 0
          }
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update animal (staff only)
router.put('/:id', auth, staffOnly, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    // Get current status for logging
    const { data: currentData, error: fetchError } = await req.app.locals.supabase
      .from('kurban')
      .select('status, meat_pieces')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // If updating meat_pieces, merge with existing data
    if (updates.meat_pieces && currentData.meat_pieces) {
      updates.meat_pieces = {
        ...currentData.meat_pieces,
        ...updates.meat_pieces
      };
    }

    // Update animal
    const { data, error } = await req.app.locals.supabase
      .from('kurban')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Log status change if status was updated
    if (updates.status && updates.status !== currentData.status) {
      await req.app.locals.supabase
        .from('status_logs')
        .insert([
          {
            kurban_id: req.params.id,
            old_status: currentData.status,
            new_status: updates.status,
            changed_by: req.user.id,
            changed_at: new Date().toISOString()
          }
        ]);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete animal (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { error } = await req.app.locals.supabase
      .from('kurban')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
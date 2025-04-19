const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // First, check if user exists in auth.users
    const { data: authUser, error: authError } = await req.app.locals.supabaseAdmin.auth.admin
      .listUsers();

    const existingAuthUser = authUser?.users?.find(user => user.email === email);

    // If user exists in auth.users, update their role in the users table
    if (existingAuthUser) {
      console.log('User exists in auth.users, updating role...');

      // Try to update the user in users table
      const { data: updatedUser, error: updateError } = await req.app.locals.supabaseAdmin
        .from('users')
        .upsert([
          {
            id: existingAuthUser.id,
            email: existingAuthUser.email,
            role: role || 'staff',
          }
        ])
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update user role',
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User role updated successfully',
      });
    }

    // If user doesn't exist, create new user
    const { data: { user }, error } = await req.app.locals.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('Supabase Auth Error:', error);
      throw new Error('Failed to create user in Supabase');
    }

    if (!user) {
      console.error('No user data returned from Supabase');
      return res.status(500).json({
        success: false,
        error: 'Failed to create user in Supabase',
      });
    }

    console.log('Created user:', user);

    // Add role to user metadata using upsert instead of insert
    const { data: userData, error: metadataError } = await req.app.locals.supabaseAdmin
      .from('users')
      .upsert([
        {
          id: user.id,
          email: user.email,
          role: role || 'staff'
        }
      ])
      .select()
      .single();

    if (metadataError) {
      console.error('Supabase Metadata Error:', metadataError);
      // Even if metadata insertion fails, the user was created successfully
      return res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: role || 'staff',
        },
        message: 'User created but role assignment may need review',
      });
    }

    res.status(201).json({
      success: true,
      data: userData,
    });
  } catch (err) {
    console.error('Registration error:', err);

    // Check if user was actually created despite the error
    if (err.message === 'Failed to create user in Supabase') {
      const { data: existingUser } = await req.app.locals.supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', req.body.email)
        .single();

      if (existingUser) {
        return res.status(200).json({
          success: true,
          data: existingUser,
          message: 'User was actually created successfully',
        });
      }
    }

    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    console.log('Attempting login for:', email);

    // Sign in with Supabase
    const { data: authData, error: authError } = await req.app.locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!authData?.user) {
      console.error('No user data returned from auth');
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }

    console.log('Auth successful, checking user data for:', authData.user.id);

    // Get user role from database using admin client
    const { data: userData, error: userError } = await req.app.locals.supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    // If user doesn't exist in users table, create them as staff
    if (userError && userError.code === 'PGRST116') {
      console.log('User not found in users table, creating new entry');

      const { data: newUser, error: insertError } = await req.app.locals.supabaseAdmin
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            role: 'staff'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user entry:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Error creating user profile'
        });
      }

      console.log('Created new user profile:', newUser);

      return res.status(200).json({
        success: true,
        token: authData.session.access_token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'staff'
        }
      });
    }

    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching user profile'
      });
    }

    console.log('Login successful for user:', authData.user.email);

    res.status(200).json({
      success: true,
      token: authData.session.access_token,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: userData.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { data: userData, error } = await req.app.locals.supabase
      .from('users')
      .select('id, email, role')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.status(200).json({
      id: userData.id,
      email: userData.email,
      role: userData.role
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'Server Error'
    });
  }
};
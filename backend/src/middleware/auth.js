const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');

// Protect routes
exports.auth = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith('Bearer')) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    const token = req.headers.authorization.split(' ')[1];

    // Verify token with Supabase
    const { data: { user }, error } = await req.app.locals.supabase.auth.getUser(token);

    if (error || !user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    // Get user role from database
    const { data: userData, error: userError } = await req.app.locals.supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      return next(new ErrorResponse('User role not found', 401));
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: userData.role
    };

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Admin only middleware
exports.adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Only administrators can access this route', 403)
    );
  }
  next();
});

// Staff only middleware
exports.staffOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return next(
      new ErrorResponse('Only staff or administrators can access this route', 403)
    );
  }
  next();
});
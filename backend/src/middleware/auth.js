const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");

// Protect routes
exports.auth = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith("Bearer")) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    const token = req.headers.authorization.split(" ")[1];

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await req.app.locals.supabase.auth.getUser(token);

    if (error || !user) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401)
      );
    }

    // Get user role from database
    const { data: userData, error: userError } = await req.app.locals.supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError) {
      return next(new ErrorResponse("User role not found", 401));
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: userData.role,
    };

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (allowedRoles) => {
  // Ensure allowedRoles is always an array
  if (!Array.isArray(allowedRoles)) {
    // Handle cases where it might be called incorrectly (e.g., authorize('admin') instead of authorize(['admin']))
    // You could throw an error or default to a restrictive state
    console.error(
      "Authorization middleware called with non-array roles:",
      allowedRoles
    );
    // For safety, deny access if configuration is wrong
    allowedRoles = [];
  }
  return (req, res, next) => {
    // Check if user is attached by the 'auth' middleware
    if (!req.user || !req.user.role) {
      return next(
        new ErrorResponse(
          `Authentication data missing, cannot authorize access`,
          401 // Or 500 if it indicates a server setup issue
        )
      );
    }

    // Now check includes on the correctly passed array
    if (!allowedRoles.includes(req.user.role)) {
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
  if (req.user.role !== "admin") {
    return next(
      new ErrorResponse("Only administrators can access this route", 403)
    );
  }
  next();
});

// Staff only middleware
exports.staffOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "staff" && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        "Only staff or administrators can access this route",
        403
      )
    );
  }
  next();
});

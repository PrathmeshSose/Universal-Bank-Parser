// Middleware to check if the user has the required role
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the authMiddleware (authenticate)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied. No role found.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Role '${req.user.role}' is not authorized to access this route.` 
      });
    }

    next();
  };
};

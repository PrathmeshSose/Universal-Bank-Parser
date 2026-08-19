import jwt from 'jsonwebtoken';

// Middleware to verify the JWT token
export const authenticate = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ error: 'No token provided, authorization denied.' });
  }

  try {
    const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
    }

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    if (!['user', 'admin', 'super_admin'].includes(decoded.user?.role)) {
      return res.status(403).json({ error: 'Invalid token: Unrecognized role.' });
    }
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid or has expired.' });
  }
};

// Middleware to enforce Role-Based Access Control (RBAC)
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please authenticate first.' });
    }

    // Super Admin has master access to all roles
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: `Access Denied. This action requires '${requiredRole}' privileges. Your role: '${req.user.role}'` 
      });
    }

    next();
  };
};

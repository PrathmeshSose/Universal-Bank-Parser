import jwt from 'jsonwebtoken';

// Middleware to verify the JWT token
export const authenticate = (req, res, next) => {
  // Get token from the header
  const token = req.header('Authorization');

  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token provided, authorization denied.' });
  }

  try {
    // The header is usually in the format: "Bearer <token>"
    const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_123';

    // Verify token
    const decoded = jwt.verify(actualToken, jwtSecret);

    // Attach the decoded user payload to the request object
    req.user = decoded.user;
    
    // Move to the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid or has expired.' });
  }
};

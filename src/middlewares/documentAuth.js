import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';

/**
 * Document download authentication middleware
 * Supports both:
 * 1. JWT token (Bearer token) - for programmatic API access
 * 2. JWT token (query parameter ?token=...) - for direct browser access
 */
const documentAuth = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    // Try Bearer token first (from Authorization header)
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (user) {
          req.user = user;
          return resolve();
        }
        // Bearer token failed, try query parameter token
        tryQueryToken();
      })(req, res, next);
    } else {
      // No Bearer token, try query parameter token
      tryQueryToken();
    }
    
    function tryQueryToken() {
      const token = req.query.token;
      if (!token) {
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }
      
      // Create a fake request with Authorization header for passport
      const fakeReq = {
        ...req,
        headers: {
          ...req.headers,
          authorization: `Bearer ${token}`
        }
      };
      
      passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err || info || !user) {
          return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
        }
        req.user = user;
        resolve();
      })(fakeReq, res, next);
    }
  })
    .then(() => next())
    .catch((err) => next(err));
};

export default documentAuth;

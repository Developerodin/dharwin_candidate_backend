import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import { getMeetingByJoinToken } from '../services/meeting.service.js';

/**
 * Optional authentication middleware
 * Supports both:
 * 1. JWT token (Bearer token) - for authenticated users
 * 2. Meeting token (query parameter ?token=...) - for guest participants
 * 
 * Sets req.user if JWT token is valid
 * Sets req.meeting if meeting token is valid
 */
const optionalAuth = async (req, res, next) => {
  // Try JWT authentication first
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Try JWT authentication
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (user) {
          req.user = user;
          return next();
        }
        
        // JWT failed, try meeting token
        const meetingToken = req.query.token;
        if (meetingToken) {
          try {
            const meeting = await getMeetingByJoinToken(meetingToken);
            if (meeting) {
              req.meeting = meeting;
              // Verify meeting ID matches
              if (req.params.meetingId && meeting.meetingId !== req.params.meetingId) {
                return next(new ApiError(httpStatus.BAD_REQUEST, 'Meeting ID does not match token'));
              }
              return next();
            }
          } catch (error) {
            // Meeting token invalid
          }
        }
        next();
      })(req, res, next);
    });
  }
  
  // Try meeting token from query parameter (no JWT header)
  const meetingToken = req.query.token;
  if (meetingToken) {
    try {
      const meeting = await getMeetingByJoinToken(meetingToken);
      if (meeting) {
        req.meeting = meeting;
        // Verify meeting ID matches
        if (req.params.meetingId && meeting.meetingId !== req.params.meetingId) {
          return next(new ApiError(httpStatus.BAD_REQUEST, 'Meeting ID does not match token'));
        }
        return next();
      }
    } catch (error) {
      // Meeting token invalid, continue without auth
    }
  }
  
  // No valid authentication found, but continue (for public endpoints)
  next();
};

export default optionalAuth;


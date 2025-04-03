import express from 'express';
import passport from 'passport';
import { 
  googleAuthCallback, 
  googleConnectCallback, 
  getCurrentUser, 
  getConnectionStatus,
  disconnectGoogle
} from '../controllers/auth.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = express.Router();

// Route for initiating Google authentication (sign in)
router.get(
  '/google',
  (req, res, next) => {
    const authOptions = { scope: ['profile', 'email'] };
    passport.authenticate('google-auth', authOptions)(req, res, next);
  }
);

// Callback route for Google authentication
router.get(
  '/google/callback',
  passport.authenticate('google-auth', { 
    session: false, 
    failureRedirect: '/auth/error' 
  }),
  googleAuthCallback
);

// Route for connecting Google services (Gmail, Calendar)
router.get(
  '/connect/google',
  protectRoute,
  (req, res, next) => {
    const authOptions = {
      scope: [
        'profile', 
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      accessType: 'offline',
      prompt: 'consent'
    };
    passport.authenticate('google-connect', authOptions)(req, res, next);
  }
);

// Callback route for Google service connection
router.get(
  '/connect/google/callback',
  protectRoute,
  passport.authenticate('google-connect', { 
    session: false, 
    failureRedirect: '/connect/error' 
  }),
  googleConnectCallback
);

// Get current authenticated user
router.get('/me', protectRoute, getCurrentUser);

// Check connection status
router.get('/connection/status', protectRoute, getConnectionStatus);

// Disconnect Google services
router.delete('/disconnect/google', protectRoute, disconnectGoogle);

export default router;

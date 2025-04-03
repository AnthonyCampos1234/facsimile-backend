import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptions, Profile, VerifyCallback } from 'passport-google-oauth20';
import User from '../models/User';

export const configurePassport = (): void => {
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Configure Google Strategy for Authentication
  passport.use(
    'google-auth',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL as string
      } as StrategyOptions,
      async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = await User.create({
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profilePicture: profile.photos?.[0]?.value
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Configure Google Strategy for connecting Gmail and Calendar
  passport.use(
    'google-connect',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.GOOGLE_CONNECT_CALLBACK_URL as string
      } as StrategyOptions,
      async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          // Find user by googleId
          const user = await User.findOne({ googleId: profile.id });
          
          if (!user) {
            return done(new Error('User not found'), undefined);
          }

          // Store tokens for future API calls
          user.authTokens = {
            ...user.authTokens,
            google: {
              accessToken,
              refreshToken: refreshToken || user.authTokens?.google?.refreshToken || '',
              scopes: [
                'profile', 
                'email',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/calendar.readonly'
              ],
              expiresAt: new Date(Date.now() + 3600 * 1000) // Token expires in 1 hour
            }
          };
          
          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
};

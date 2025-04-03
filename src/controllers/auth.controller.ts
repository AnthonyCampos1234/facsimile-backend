import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';

// Generate JWT token for authenticated user
export const generateToken = (user: IUser): string => {
  const payload = { id: user._id, email: user.email };
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  
  // Use a hardcoded expiration time if not provided in env
  const expiry = '1d';
  const options: SignOptions = { 
    expiresIn: expiry
  };
  
  return jwt.sign(payload, secret, options);
};

// Handle Google authentication callback
export const googleAuthCallback = (req: Request, res: Response): void => {
  try {
    const user = req.user as IUser;
    const token = generateToken(user);

    // Set JWT as cookie and redirect to frontend
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to frontend with success
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/auth/success`);
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/auth/error`);
  }
};

// Handle Google connect callback (for data access)
export const googleConnectCallback = (req: Request, res: Response): void => {
  try {
    // Redirect to frontend with success
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/connect/success`);
  } catch (error) {
    console.error('Connection error:', error);
    res.redirect(`${process.env.CORS_ORIGIN || 'http://localhost:3000'}/connect/error`);
  }
};

// Get current authenticated user
export const getCurrentUser = (req: Request, res: Response): void => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user has connected Google services (Gmail, Calendar)
export const getConnectionStatus = (req: Request, res: Response): void => {
  try {
    const user = req.user as IUser;
    
    // Check if user has valid Google tokens for data access
    const isConnected = !!(
      user.authTokens?.google?.accessToken && 
      user.authTokens?.google?.refreshToken
    );
    
    res.status(200).json({
      success: true,
      isConnected,
      // Include scopes if connected
      scopes: isConnected ? user.authTokens?.google?.scopes : []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Disconnect Google services
export const disconnectGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    
    // Remove Google tokens
    if (user.authTokens?.google) {
      user.authTokens.google = undefined;
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Google services disconnected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

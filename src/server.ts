import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import { configurePassport } from "./config/passport";
import authRoutes from "./routes/auth.routes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose
  .connect(process.env.DB_HOST || "mongodb://localhost:27017/facsimile_db")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
configurePassport();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "PUT", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// API Routes
const apiPrefix = process.env.API_PREFIX || "/api/v1";
app.use(`${apiPrefix}/auth`, authRoutes);

// Direct routes for Google OAuth that match registered URIs in Google Cloud Console
import { googleConnectCallback } from "./controllers/auth.controller";
import { protectRoute } from "./middleware/auth.middleware";

// Direct Google connect route with correct callback URL
app.get(`${apiPrefix}/connect/google`, protectRoute, (req, res, next) => {
  const authOptions = {
    scope: [
      'profile', 
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent',
    // Override the callbackURL to match what's registered in Google Cloud Console
    callbackURL: `http://localhost:3001${apiPrefix}/connect/google/callback`
  };
  passport.authenticate('google-connect', authOptions)(req, res, next);
});

// Callback route that matches the registered URI in Google Cloud Console
app.get(
  `${apiPrefix}/connect/google/callback`,
  protectRoute,
  passport.authenticate("google-connect", { 
    session: false, 
    failureRedirect: "/connect/error" 
  }),
  googleConnectCallback
);

// Home route
app.get("/", (req: Request, res: Response) => {
  res.send("Facsimile API is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

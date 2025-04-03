import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  googleId?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  authTokens?: {
    google?: {
      accessToken: string;
      refreshToken: string;
      scopes: string[];
      expiresAt: Date;
    }
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  displayName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  profilePicture: { type: String },
  authTokens: {
    google: {
      accessToken: { type: String },
      refreshToken: { type: String },
      scopes: [{ type: String }],
      expiresAt: { type: Date }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the 'updatedAt' field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IUser>('User', UserSchema);

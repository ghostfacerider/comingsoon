// Create this as a separate file: src/users/interfaces/user.interface.ts
import { Document } from 'mongoose';

// Simple interface for user data without conflicting with Mongoose Document
export interface IUserData {
  email: string;
  password: string;
  isActive: boolean;
  emailVerified: boolean;
}

// This represents a user document from MongoDB with the _id field
export interface IUserDocument extends Document {
  email: string;
  password: string;
  isActive: boolean;
  emailVerified: boolean;
}

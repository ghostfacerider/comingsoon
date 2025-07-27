import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Changed from bcryptjs to bcrypt
import { UsersService } from '../user/users.service';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Validate user credentials
  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user; // Return the full user document
    }
    return null;
  }

  // Generate JWT token for login
  async login(user: UserDocument) {
    const payload = { email: user.email, sub: user._id.toString() }; // Convert ObjectId to string
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }), // Optional: longer expiry for refresh
    };
  }

  // Public method to find user by email
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.usersService.findByEmail(email);
  }

  // Public method to create user
  async createUser(userData: {
    email: string;
    password: string;
  }): Promise<UserDocument> {
    return this.usersService.create(userData.email, userData.password);
  }

  // Public method to find user by ID (needed for JWT strategy)
  async findUserById(id: string): Promise<UserDocument | null> {
    return this.usersService.findById(id);
  }

  // Refresh JWT token
  async refreshToken(user: UserDocument) {
    const payload = { email: user.email, sub: user._id.toString() }; // Convert ObjectId to string
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Logout user (you can implement token blacklisting here if needed)
  async logout(userId: string) {
    // Implement your logout logic here
    // For example, you might want to blacklist the token
    // or update user's last logout time
    console.log(`User ${userId} logged out`);
    return { success: true };
  }
}

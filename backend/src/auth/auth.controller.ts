import {
  Controller,
  Post,
  Body,
  Request,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { InviteTokensService } from './invite-tokens.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { isDisposableEmail } from '../utils/email.util';
import { UserDocument } from '../user/user.schema';

// DTOs for request validation
class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Invite token is required' })
  token: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly inviteTokensService: InviteTokensService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Validate user credentials
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Generate and return JWT token
      const result = await this.authService.login(user);
      return {
        success: true,
        ...result,
        user: {
          id: user._id.toString(), // MongoDB Document has _id, convert to string
          email: user.email,
          // Don't return sensitive information
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed. Please try again.');
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      const { email, password, token } = registerDto;

      // Validate email format and check for disposable emails
      if (isDisposableEmail(email)) {
        throw new BadRequestException(
          'Disposable email addresses are not allowed',
        );
      }

      // Validate invite token
      const isValidToken = await this.inviteTokensService.validateToken(token);
      if (!isValidToken) {
        throw new BadRequestException('Invalid or expired invite token');
      }

      // Check if user already exists - using the new AuthService method
      const existingUser: UserDocument | null =
        await this.authService.findUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException(
          'An account with this email already exists',
        );
      }

      // Validate password strength
      if (!this.isPasswordStrong(password)) {
        throw new BadRequestException(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        );
      }

      // Hash password
      const saltRounds = 12; // Increased from 10 for better security
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user - using the new AuthService method
      const user: UserDocument = await this.authService.createUser({
        email,
        password: hashedPassword,
      });

      // Mark invite token as used
      await this.inviteTokensService.markUsed(token);

      return {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id.toString(), // MongoDB Document has _id, convert to string
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify(@Request() req: any) {
    try {
      const user = req.user;

      // Additional verification logic can be added here
      // For example, checking if the user's email is verified

      return {
        valid: true,
        user: {
          id: user._id.toString(), // MongoDB Document has _id, convert to string
          email: user.email,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Token verification failed');
    }
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: any) {
    try {
      const user = req.user;
      const result = await this.authService.refreshToken(user);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    try {
      const user = req.user;

      // Invalidate refresh token or add to blacklist
      await this.authService.logout(user._id.toString()); // Convert ObjectId to string

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new BadRequestException('Logout failed');
    }
  }

  /**
   * Validates password strength
   * Requirements: at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
   */
  private isPasswordStrong(password: string): boolean {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return strongPasswordRegex.test(password) && password.length >= 8;
  }
}

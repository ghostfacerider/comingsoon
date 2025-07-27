import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Log authentication attempts for security monitoring
    if (err || !user) {
      this.logger.warn(
        `Authentication failed for ${request.ip}: ${info?.message || err?.message || 'Unknown error'}`,
      );
    } else {
      this.logger.debug(`User ${user.email} authenticated successfully`);
    }

    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException(this.getErrorMessage(info));
    }

    // Additional user validation can be added here
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  private getErrorMessage(info: any): string {
    if (!info) {
      return 'Authentication failed';
    }

    switch (info.name) {
      case 'JsonWebTokenError':
        return 'Invalid token';
      case 'TokenExpiredError':
        return 'Token has expired';
      case 'NotBeforeError':
        return 'Token not active';
      default:
        return info.message || 'Authentication failed';
    }
  }
}

import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (bypassing JWT authentication)
 * Usage: @Public() above your route handler
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Alternative decorator names for different use cases
 */
export const IsPublic = () => SetMetadata('isPublic', true);
export const SkipAuth = () => SetMetadata('isPublic', true);
export const NoAuth = () => SetMetadata('isPublic', true);

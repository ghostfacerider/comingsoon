import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteToken } from '../entities/invite-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InviteTokensService {
  private readonly logger = new Logger(InviteTokensService.name);

  constructor(
    @InjectRepository(InviteToken)
    private readonly inviteTokenRepository: Repository<InviteToken>,
  ) {}

  /**
   * Create a new invite token
   * @param createdBy - ID of the user creating the token
   * @param expiresInHours - Hours until token expires (default: 168 = 7 days)
   * @param maxUses - Maximum number of uses (default: 1)
   * @returns The created invite token
   */
  async createToken(
    createdBy: string,
    expiresInHours: number = 168,
    maxUses: number = 1,
  ): Promise<InviteToken> {
    try {
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const inviteToken = this.inviteTokenRepository.create({
        token,
        createdBy,
        expiresAt,
        maxUses,
        usedCount: 0,
        isActive: true,
      });

      const savedToken = await this.inviteTokenRepository.save(inviteToken);
      this.logger.log(`Created invite token: ${token} by user: ${createdBy}`);

      return savedToken;
    } catch (error) {
      this.logger.error(`Failed to create invite token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate if a token is valid and can be used
   * @param token - The token string to validate
   * @returns True if token is valid, false otherwise
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const inviteToken = await this.inviteTokenRepository.findOne({
        where: { token },
      });

      if (!inviteToken) {
        this.logger.warn(`Token not found: ${token}`);
        return false;
      }

      // Check if token is active
      if (!inviteToken.isActive) {
        this.logger.warn(`Token is inactive: ${token}`);
        return false;
      }

      // Check if token has expired
      if (inviteToken.expiresAt < new Date()) {
        this.logger.warn(`Token has expired: ${token}`);
        await this.deactivateToken(token);
        return false;
      }

      // Check if token has reached max uses
      if (inviteToken.usedCount >= inviteToken.maxUses) {
        this.logger.warn(`Token has reached max uses: ${token}`);
        await this.deactivateToken(token);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating token: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark a token as used
   * @param token - The token string to mark as used
   * @returns True if successful, false otherwise
   */
  async markUsed(token: string): Promise<boolean> {
    try {
      const inviteToken = await this.inviteTokenRepository.findOne({
        where: { token },
      });

      if (!inviteToken) {
        this.logger.warn(`Token not found when marking as used: ${token}`);
        return false;
      }

      inviteToken.usedCount += 1;
      inviteToken.lastUsedAt = new Date();

      // Deactivate if max uses reached
      if (inviteToken.usedCount >= inviteToken.maxUses) {
        inviteToken.isActive = false;
      }

      await this.inviteTokenRepository.save(inviteToken);
      this.logger.log(
        `Marked token as used: ${token} (${inviteToken.usedCount}/${inviteToken.maxUses})`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error marking token as used: ${error.message}`);
      return false;
    }
  }

  /**
   * Deactivate a token
   * @param token - The token string to deactivate
   * @returns True if successful, false otherwise
   */
  async deactivateToken(token: string): Promise<boolean> {
    try {
      const result = await this.inviteTokenRepository.update(
        { token },
        { isActive: false },
      );

      if (result.affected && result.affected > 0) {
        this.logger.log(`Deactivated token: ${token}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error deactivating token: ${error.message}`);
      return false;
    }
  }

  /**
   * Get all tokens created by a specific user
   * @param userId - ID of the user
   * @returns Array of invite tokens
   */
  async getTokensByUser(userId: string): Promise<InviteToken[]> {
    try {
      return await this.inviteTokenRepository.find({
        where: { createdBy: userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting tokens by user: ${error.message}`);
      return [];
    }
  }

  /**
   * Get token details by token string
   * @param token - The token string
   * @returns Token details or null
   */
  async getTokenDetails(token: string): Promise<InviteToken | null> {
    try {
      return await this.inviteTokenRepository.findOne({
        where: { token },
      });
    } catch (error) {
      this.logger.error(`Error getting token details: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean up expired tokens (should be run as a scheduled job)
   * @returns Number of cleaned up tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await this.inviteTokenRepository.delete({
        expiresAt: { $lt: new Date() } as any,
        isActive: false,
      });

      const deletedCount = result.affected || 0;
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} expired tokens`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Error cleaning up expired tokens: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get usage statistics for tokens
   * @returns Usage statistics
   */
  async getUsageStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    usedTokens: number;
  }> {
    try {
      const [totalTokens, activeTokens, expiredTokens, usedTokens] =
        await Promise.all([
          this.inviteTokenRepository.count(),
          this.inviteTokenRepository.count({ where: { isActive: true } }),
          this.inviteTokenRepository.count({
            where: { expiresAt: { $lt: new Date() } as any },
          }),
          this.inviteTokenRepository.count({
            where: { usedCount: { $gt: 0 } as any },
          }),
        ]);

      return {
        totalTokens,
        activeTokens,
        expiredTokens,
        usedTokens,
      };
    } catch (error) {
      this.logger.error(`Error getting usage stats: ${error.message}`);
      return {
        totalTokens: 0,
        activeTokens: 0,
        expiredTokens: 0,
        usedTokens: 0,
      };
    }
  }
}

// invite-tokens.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InviteToken, InviteTokenDocument } from './invite-token.schema';
import { Model } from 'mongoose';

@Injectable()
export class InviteTokensService {
  constructor(
    @InjectModel(InviteToken.name) private model: Model<InviteTokenDocument>,
  ) {}

  async validateToken(token: string): Promise<boolean> {
    const invite = await this.model.findOne({ token });
    if (!invite) return false;
    if (invite.expiresAt && invite.expiresAt < new Date()) return false;
    if (invite.usedCount >= invite.maxUses) return false;
    return true;
  }

  async markUsed(token: string) {
    await this.model.updateOne({ token }, { $inc: { usedCount: 1 } });
  }

  async createToken(token: string, maxUses = 1, expiresAt?: Date) {
    return this.model.create({ token, maxUses, expiresAt });
  }
}

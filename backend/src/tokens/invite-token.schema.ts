// invite-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InviteTokenDocument = InviteToken & Document;

@Schema({ timestamps: true })
export class InviteToken {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ default: false })
  used: boolean;

  @Prop({ default: 1 }) // allow multiple uses if needed
  maxUses: number;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop()
  expiresAt?: Date;
}

export const InviteTokenSchema = SchemaFactory.createForClass(InviteToken);

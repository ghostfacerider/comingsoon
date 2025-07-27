// invite-tokens.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InviteToken, InviteTokenSchema } from './invite-token.schema';
import { InviteTokensService } from './invite-tokens.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InviteToken.name, schema: InviteTokenSchema },
    ]),
  ],
  providers: [InviteTokensService],
  exports: [InviteTokensService],
})
export class InviteTokensModule {}

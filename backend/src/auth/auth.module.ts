import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { UsersModule } from '../user/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteTokensService } from './invite-tokens.service';
import { InviteToken } from '../entities/invite-token.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([InviteToken]),
  ],
  providers: [AuthService, InviteTokensService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, InviteTokensService],
})
export class AuthModule {}


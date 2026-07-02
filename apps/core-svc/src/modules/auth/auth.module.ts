import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { EkycController } from './ekyc.controller';
import { AuthService } from './auth.service';
import { EkycVerificationService } from './ekyc-verification.service';
import { JwtStrategy } from './jwt.strategy';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION', '24h') },
      }),
    }),
  ],
  controllers: [AuthController, EkycController],
  providers: [AuthService, EkycVerificationService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

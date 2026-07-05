import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { EkycController } from './ekyc.controller';
import { AuthService } from './auth.service';
import { EkycVerificationService } from './ekyc-verification.service';
import { User, UserSchema } from '../../database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // JwtModule chỉ dùng để ký access token bằng RS256 private key.
    // Việc verify JWT đã được api-gateway xử lý trước khi request vào core-svc.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        privateKey: config.get<string>('JWT_ACCESS_PRIVATE_KEY'),
        publicKey: config.get<string>('JWT_ACCESS_PUBLIC_KEY'),
        signOptions: {
          algorithm: 'RS256',
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '30m'),
        },
      }),
    }),
  ],
  controllers: [AuthController, EkycController],
  providers: [AuthService, EkycVerificationService],
  exports: [AuthService],
})
export class AuthModule {}


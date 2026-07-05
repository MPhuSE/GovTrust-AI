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
    // JwtModule dùng để ký access token bằng secret.
    // Việc verify JWT đã được api-gateway xử lý trước khi request vào core-svc.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '24h'),
        },
      }),
    }),
  ],
  controllers: [AuthController, EkycController],
  providers: [AuthService, EkycVerificationService],
  exports: [AuthService],
})
export class AuthModule {}


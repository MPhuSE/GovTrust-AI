import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../database/schemas/user.schema';

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvana', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'matkhau123', minLength: 6, description: 'Mật khẩu (>= 6 ký tự)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên đầy đủ' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.CITIZEN,
    description: 'Vai trò; mặc định CITIZEN. Đăng ký OFFICER để test Bước 9–11.',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class LoginDto {
  @ApiProperty({ example: 'nguyenvana' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'matkhau123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

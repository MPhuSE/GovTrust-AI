import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiPropertyOptional({ example: 'nguyenvana', description: 'Tên đăng nhập (tùy chọn; sẽ dùng CCCD nếu không có)' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: 'MyP@ssw0rd123!',
    minLength: 8,
    description: 'Mật khẩu (>= 8 ký tự, phải có chữ hoa, chữ thường, số và ký tự đặc biệt)'
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]{8,}$/,
    { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt' }
  )
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ tên đầy đủ' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'nguyenvana@example.com', description: 'Email liên hệ' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;
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

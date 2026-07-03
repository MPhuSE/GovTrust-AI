import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserRole } from '../../database/schemas/user.schema';

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  fullName: z.string().min(1),
  // Cho phép đăng ký OFFICER/ADMIN để test Bước 9–11 (mặc định CITIZEN ở service).
  role: z.nativeEnum(UserRole).optional(),
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}

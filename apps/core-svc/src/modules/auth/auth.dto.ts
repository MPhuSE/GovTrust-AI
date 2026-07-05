import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]{8,}$/;

const RegisterSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(passwordRegex, 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'),
  fullName: z.string().min(1),
  phoneNumber: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  // KHÔNG nhận `role` từ client: đăng ký công khai luôn tạo CITIZEN.
  // Tài khoản OFFICER/ADMIN cấp qua scripts/seed-officer.js (nội bộ).
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}

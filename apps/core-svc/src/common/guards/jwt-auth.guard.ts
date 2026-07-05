import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Guard đọc danh tính từ headers X-User-Id / X-Role mà api-gateway đã
 * gắn vào sau khi verify JWT bằng RS256 public key.
 *
 * core-svc KHÔNG verify JWT lần 2 — tin tưởng gateway (internal network).
 * Nếu X-User-Id vắng mặt → request không đi qua gateway hoặc là public
 * endpoint bị gọi nhầm → 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.headers['x-user-id'] as string | undefined;
    const role   = req.headers['x-role']    as string | undefined;

    if (!userId) {
      throw new UnauthorizedException('Thiếu thông tin xác thực từ gateway');
    }

    // Gắn vào req.user để @CurrentUser() decorator hoạt động như cũ
    req.user = { userId, role };
    return true;
  }
}


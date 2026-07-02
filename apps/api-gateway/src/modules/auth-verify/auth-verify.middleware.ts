import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * auth-verify (mỏng) — middleware verify JWT ở edge.
 *
 * - Path public (PUBLIC_PREFIXES): cho qua, không bắt token.
 * - Path khác: bắt buộc Bearer token hợp lệ → gắn X-User-Id / X-Role cho core-svc.
 *   core-svc tin tưởng 2 header này (chỉ gateway expose ra ngoài).
 */
@Injectable()
export class AuthVerifyMiddleware {
  private readonly logger = new Logger(AuthVerifyMiddleware.name);
  private readonly secret: string;

  // Prefix không cần đăng nhập
  private readonly PUBLIC_PREFIXES = [
    '/health',
    '/auth/login',
    '/auth/register',
    '/procedures',       // GET danh sách/chi tiết thủ tục — public
    '/document-types',
    '/api/docs',         // Swagger UI
    '/api/docs-json',    // Swagger JSON
  ];

  constructor(jwt: JwtService, config: ConfigService) {
    this.secret = config.get<string>('JWT_SECRET', 'dev-secret');
    this._jwt = jwt;
  }
  private _jwt: JwtService;

  use = (req: Request, res: Response, next: NextFunction): void => {
    const path = req.originalUrl.split('?')[0];

    if (this.PUBLIC_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
      return next();
    }

    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ statusCode: 401, message: 'Thiếu token xác thực' });
      return;
    }

    try {
      const payload = this._jwt.verify(auth.slice(7), { secret: this.secret }) as {
        sub?: string;
        role?: string;
      };
      // Gắn danh tính cho downstream (core-svc)
      req.headers['x-user-id'] = payload.sub ?? '';
      req.headers['x-role'] = payload.role ?? '';
      next();
    } catch {
      res.status(401).json({ statusCode: 401, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  };
}

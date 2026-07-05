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
  private readonly publicKey: string;

  // Prefix không cần đăng nhập
  private readonly PUBLIC_PREFIXES = [
    '/health',
    '/auth/login',
    '/auth/register',
    '/procedures',       // GET danh sách/chi tiết thủ tục — public
    '/document-types',
    '/api/docs',         // Swagger UI + static assets under /api/docs/
    '/api/docs-json',    // OpenAPI JSON spec mà Swagger UI fetch
    '/api/docs-yaml',
  ];

  constructor(private readonly _jwt: JwtService, config: ConfigService) {
    this.publicKey = config.get<string>('JWT_ACCESS_PUBLIC_KEY', '');
  }

  use = (req: Request, res: Response, next: NextFunction): void => {
    // forRoutes('*') mounts middleware trên sub-router → req.path bị rút thành "/".
    // Chỉ originalUrl giữ path đầy đủ; cắt query string để so khớp prefix.
    const path = (req.originalUrl || req.url).split('?')[0];

    if (this.PUBLIC_PREFIXES.some(p => path === p || path.startsWith(p + '/'))) {
      return next();
    }

    const auth = req.headers['authorization'];
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ statusCode: 401, message: 'Thiếu token xác thực' });
      return;
    }

    try {
      const payload = this._jwt.verify(auth.slice(7), {
        // RS256: verify bằng public key, không cần secret
        publicKey: this.publicKey,
        algorithms: ['RS256'],
      } as any) as { sub?: string; role?: string };

      // Gắn danh tính cho downstream (core-svc)
      req.headers['x-user-id'] = payload.sub ?? '';
      req.headers['x-role'] = payload.role ?? '';
      next();
    } catch {
      res.status(401).json({ statusCode: 401, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
  };
}


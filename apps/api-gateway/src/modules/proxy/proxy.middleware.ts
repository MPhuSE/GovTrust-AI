import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';

/**
 * proxy (mỏng) — forward mọi request đã qua auth-verify sang core-svc (HTTP).
 * Gateway giữ mỏng: không parse body, chỉ chuyển tiếp + giữ header x-user-id/x-role.
 */
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProxyMiddleware.name);
  private readonly handler: RequestHandler;

  constructor(config: ConfigService) {
    const target = config.get<string>('CORE_SVC_URL', 'http://localhost:4000');
    this.logger.log(`Proxy → core-svc: ${target}`);

    this.handler = createProxyMiddleware({
      target,
      changeOrigin: true,
      // Giữ nguyên path; core-svc nhận như cũ
      on: {
        error: (err, _req, res) => {
          this.logger.error(`Proxy error: ${err.message}`);
          (res as Response).status?.(502).json?.({ statusCode: 502, message: 'core-svc không phản hồi' });
        },
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // NestJS strips the path when using forRoutes('*'), so we restore it for the proxy
    req.url = req.originalUrl;
    return this.handler(req, res, next);
  }
}

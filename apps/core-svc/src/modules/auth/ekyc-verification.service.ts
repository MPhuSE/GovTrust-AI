import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EkycFiles {
  front: Express.Multer.File;
  back: Express.Multer.File;
  selfie: Express.Multer.File;
}

export interface EkycField {
  value: string;
  confidence: number;
}

export interface EkycVerificationResult {
  verified: boolean;
  ocrFields: Record<string, EkycField>;
  matchFrontBack: Record<string, string>;
  faceMatch: boolean;
  faceMatchProb: number;
  liveness: boolean;
  warnings: string[];
  processingTimeMs: number;
}

@Injectable()
export class EkycVerificationService {
  private readonly aiSvcUrl: string;

  constructor(config: ConfigService) {
    const explicitUrl = config.get<string>('AI_SVC_HTTP_URL');
    if (explicitUrl) {
      this.aiSvcUrl = explicitUrl.replace(/\/$/, '');
      return;
    }

    const grpcUrl = config.get<string>('AI_SVC_GRPC_URL', 'localhost:50051');
    const grpcHost = grpcUrl.replace(/^grpc:\/\//, '').split(':')[0];
    const host = grpcHost === '0.0.0.0' ? 'localhost' : grpcHost;
    const port = config.get<number>('AI_SVC_PORT', 8000);
    this.aiSvcUrl = `http://${host}:${port}`;
  }

  async verify(files: EkycFiles): Promise<EkycVerificationResult> {
    const formData = new FormData();
    formData.append(
      'front',
      new Blob([new Uint8Array(files.front.buffer)]),
      files.front.originalname,
    );
    formData.append(
      'back',
      new Blob([new Uint8Array(files.back.buffer)]),
      files.back.originalname,
    );
    formData.append(
      'selfie',
      new Blob([new Uint8Array(files.selfie.buffer)]),
      files.selfie.originalname,
    );

    try {
      const response = await fetch(`${this.aiSvcUrl}/api/v1/ekyc/verify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`ai-svc trả lỗi ${response.status}`);
      }

      const result = (await response.json()) as EkycVerificationResult;
      if (typeof result?.verified !== 'boolean') {
        throw new Error('ai-svc trả về kết quả eKYC không hợp lệ');
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadGatewayException(`Lỗi gọi ai-svc eKYC: ${message}`);
    }
  }
}

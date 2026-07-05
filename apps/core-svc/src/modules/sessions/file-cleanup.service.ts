import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SessionDocument } from '../../database/schemas/session.schema';

/**
 * Vòng đời file upload theo docs/Gov_Trust.md (data minimization):
 * - Xoá ngay khi người dân xác nhận hồ sơ (OCR đã xong, kết quả nằm trong aiResult).
 * - Sweep định kỳ xoá file ảnh giấy tờ gốc quá FILE_TTL_MINUTES (mặc định 30 phút) —
 *   bắt các phiên bị bỏ dở (upload xong nhưng không xác nhận). Metadata session giữ theo
 *   SESSION_TTL_HOURS riêng; ảnh gốc là PII nhạy cảm nên xoá nhanh hơn nhiều.
 */
@Injectable()
export class FileCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FileCleanupService.name);
  private sweepTimer?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService) {}

  private get uploadDir(): string {
    return this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  private get ttlMs(): number {
    // Ảnh giấy tờ gốc (PII) xoá sau FILE_TTL_MINUTES — mặc định 30 phút.
    return this.config.get<number>('FILE_TTL_MINUTES', 30) * 60 * 1000;
  }

  onModuleInit() {
    // Sweep 5 phút/lần để mốc 30 phút có ý nghĩa (file bỏ dở bị quét trong ≤35 phút).
    const sweepIntervalMs = 5 * 60 * 1000;
    this.sweepTimer = setInterval(() => {
      this.sweepExpiredUploads().catch(e =>
        this.logger.warn(`Sweep file hết hạn thất bại: ${(e as Error).message}`),
      );
    }, sweepIntervalMs);
    this.sweepTimer.unref();
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  /** Xoá file vật lý của phiên, giữ lại metadata (originalName, uploadTime). */
  async deleteSessionFiles(session: SessionDocument): Promise<void> {
    let deleted = 0;
    for (const doc of session.documents ?? []) {
      if (!doc.fileUrl) continue;
      try {
        await fs.unlink(doc.fileUrl);
        deleted++;
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code !== 'ENOENT') {
          this.logger.warn(`Không xoá được file ${doc.fileUrl}: ${err.message}`);
          continue;
        }
      }
      doc.fileUrl = '';
    }
    if (deleted > 0) {
      session.markModified('documents');
      await session.save();
      this.logger.log(`Đã xoá ${deleted} file upload của phiên ${session._id}`);
    }
  }

  /** Xoá mọi file trong UPLOAD_DIR cũ hơn FILE_TTL_MINUTES (theo mtime). */
  async sweepExpiredUploads(): Promise<number> {
    const cutoff = Date.now() - this.ttlMs;
    let entries: string[];
    try {
      entries = await fs.readdir(this.uploadDir);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return 0;
      throw e;
    }

    let deleted = 0;
    for (const name of entries) {
      const filePath = path.join(this.uploadDir, name);
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile() && stat.mtimeMs < cutoff) {
          await fs.unlink(filePath);
          deleted++;
        }
      } catch {
        // File có thể vừa bị xoá bởi luồng khác — bỏ qua.
      }
    }
    if (deleted > 0) this.logger.log(`Sweep: đã xoá ${deleted} file upload hết hạn`);
    return deleted;
  }
}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UploadSchema = z.object({
  sessionId: z.string().min(1),
  documentTypeCode: z.string().min(1),
  checklistId: z.string().min(1),
});

const TriggerOcrSchema = z.object({
  checklistId: z.string().min(1),
});

export class UploadDto extends createZodDto(UploadSchema) {}
export class TriggerOcrDto extends createZodDto(TriggerOcrSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const IdentifySchema = z.object({
  userQuery: z.string().min(1),
});

export class IdentifyDto extends createZodDto(IdentifySchema) {}

const ConsultSchema = z.object({
  question: z.string().min(2),
  procedureCode: z.string().min(1),
  topK: z.number().int().min(1).max(12).optional(),
});

export class ConsultDto extends createZodDto(ConsultSchema) {}

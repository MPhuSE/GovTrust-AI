import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const IdentifySchema = z.object({
  userQuery: z.string().min(1),
});

export class IdentifyDto extends createZodDto(IdentifySchema) {}

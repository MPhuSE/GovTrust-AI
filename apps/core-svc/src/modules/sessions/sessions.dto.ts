import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateSessionSchema = z.object({
  procedureId: z.string().min(1),
});

export class CreateSessionDto extends createZodDto(CreateSessionSchema) {}

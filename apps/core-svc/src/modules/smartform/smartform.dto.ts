import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RenderSmartFormSchema = z.object({
  values: z.record(z.string(), z.string().max(2000)),
});

export class RenderSmartFormDto extends createZodDto(RenderSmartFormSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ChunkSchema = z.object({
  chunkId: z.string().min(1).max(200),
  text: z.string().min(1).max(100_000),
  title: z.string().max(500).default(''),
  article: z.string().max(200).default(''),
  url: z.string().max(2_000).default(''),
  sourceVersion: z.string().max(100).default(''),
  category: z.string().max(100).default(''),
});

export class CreateEmbeddingJobDto extends createZodDto(z.object({
  chunks: z.array(ChunkSchema).min(1).max(128),
})) {}


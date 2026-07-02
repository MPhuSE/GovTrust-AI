export const AI_TASKS_QUEUE = 'ai-pipeline';

export const AI_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export enum AiJobName {
  OCR_EXTRACT = 'ocr-extract',
  CROSSCHECK = 'crosscheck',
  SCORE = 'score',
  LAWGUARD = 'lawguard',
  SMARTFORM = 'smartform',
  EMBEDDING = 'embedding',
  INSIGHT_REPORT = 'insight-report',
}

export const PIPELINE_STEPS = [
  { key: 'procedure', label: 'Chọn thủ tục' },
  { key: 'upload', label: 'Upload giấy tờ' },
  { key: 'ocr', label: 'Bóc tách thông tin' },
  { key: 'crosscheck', label: 'Kiểm tra chéo' },
  { key: 'score', label: 'Chấm điểm hồ sơ' },
  { key: 'lawguard', label: 'Tra cứu pháp lý' },
  { key: 'smartform', label: 'Tự điền form' },
  { key: 'confirm', label: 'Xác nhận hồ sơ' },
] as const;

export const GRADE_COLORS = {
  A: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
  B: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
  D: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' },
} as const;

export const SEVERITY_COLORS = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-orange-600',
  CRITICAL: 'text-red-600',
} as const;

export const DISCLAIMER =
  'Thông tin trên chỉ mang tính tham khảo. Quyết định cuối cùng thuộc cơ quan có thẩm quyền.';

export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

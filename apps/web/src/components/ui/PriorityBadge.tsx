interface PriorityBadgeProps {
  level: 'A' | 'B' | 'C' | 'D';
}

const PRIORITY_CONFIG = {
  A: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Khẩn cấp' },
  B: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Cao' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', label: 'Trung bình' },
  D: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Thấp' },
};

export function PriorityBadge({ level }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}
      aria-label={`Ưu tiên ${level}: ${config.label}`}
    >
      {level}
      <span className="font-medium">{config.label}</span>
    </span>
  );
}

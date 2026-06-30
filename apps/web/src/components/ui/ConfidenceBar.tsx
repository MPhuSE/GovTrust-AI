interface ConfidenceBarProps {
  value: number;
  label?: string;
}

export function ConfidenceBar({ value, label = 'Độ tin cậy của AI' }: ConfidenceBarProps) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  const getColor = () => {
    if (clampedValue >= 80) return 'bg-blue-500';
    if (clampedValue >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 shrink-0">{label}:</span>
      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getColor()}`}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${clampedValue}%`}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 shrink-0 tabular-nums">
        {clampedValue}%
      </span>
    </div>
  );
}

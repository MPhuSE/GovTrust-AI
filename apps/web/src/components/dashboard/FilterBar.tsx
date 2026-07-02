'use client';

interface Props {
  days: number;
  onChange: (days: number) => void;
}

const OPTIONS = [7, 14, 30, 90];

export function FilterBar({ days, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
            days === d
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
          }`}
        >
          {d} ngày
        </button>
      ))}
    </div>
  );
}

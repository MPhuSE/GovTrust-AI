'use client';

interface ProgressProps {
  steps: string[];
  currentIndex: number;
}

export function Progress({ steps, currentIndex }: ProgressProps) {
  return (
    <nav aria-label="Tiến độ hồ sơ">
      <ol className="flex items-center w-full text-xs text-gray-400">
        {steps.map((step, i) => (
          <li
            key={step}
            className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-semibold text-sm border-2 ${
                i < currentIndex
                  ? 'bg-blue-700 border-blue-700 text-white'
                  : i === currentIndex
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              {i < currentIndex ? '✓' : i + 1}
            </span>
            <span className={`hidden sm:inline ml-1 ${i === currentIndex ? 'text-blue-700 font-medium' : ''}`}>
              {step}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentIndex ? 'bg-blue-700' : 'bg-gray-200'}`} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

'use client';

interface ProgressProps {
  steps: string[];
  currentIndex: number;
  totalLabel?: string;
}

export function Progress({ steps, currentIndex, totalLabel }: ProgressProps) {
  return (
    <nav aria-label="Tiến độ hồ sơ" className="animate-fade-in">
      {/* Step label on mobile */}
      <div className="flex items-center justify-between mb-3 sm:hidden">
        <span className="text-sm font-medium text-gray-700">
          Bước {Math.min(currentIndex + 1, steps.length)}/{steps.length}: {steps[Math.min(currentIndex, steps.length - 1)]}
        </span>
        {totalLabel && (
          <span className="text-sm text-blue-600 font-semibold">{totalLabel}</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step indicator */}
            <div className="flex flex-col items-center relative">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 font-semibold text-sm border-2 transition-all duration-300 ${
                  i < currentIndex
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : i === currentIndex
                    ? 'border-blue-500 text-blue-600 bg-blue-50 ring-4 ring-blue-100'
                    : 'border-gray-300 text-gray-400 bg-white'
                }`}
                aria-current={i === currentIndex ? 'step' : undefined}
              >
                {i < currentIndex ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {/* Label - desktop only */}
              <span
                className={`hidden sm:block absolute top-10 text-xs whitespace-nowrap transition-colors ${
                  i === currentIndex
                    ? 'text-blue-700 font-semibold'
                    : i < currentIndex
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-1 mx-1 sm:mx-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all duration-500 ease-out"
                  style={{ width: i < currentIndex ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop right label */}
      {totalLabel && (
        <div className="hidden sm:flex justify-end mt-1">
          <span className="text-sm text-blue-600 font-semibold">{totalLabel}</span>
        </div>
      )}
    </nav>
  );
}

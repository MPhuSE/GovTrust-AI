interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'table-row' | 'score';
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = 'text', lines = 3, className = '' }: LoadingSkeletonProps) {
  switch (variant) {
    case 'circle':
      return <div className={`skeleton w-40 h-40 rounded-full mx-auto ${className}`} />;

    case 'card':
      return (
        <div className={`bg-white rounded-xl border border-gray-200 p-6 space-y-4 ${className}`}>
          <div className="skeleton h-5 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-10 w-full rounded-lg mt-2" />
        </div>
      );

    case 'table-row':
      return (
        <div className={`flex items-center gap-4 py-3 ${className}`}>
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 flex-1 rounded" />
          <div className="skeleton h-6 w-12 rounded-full" />
          <div className="skeleton h-6 w-20 rounded" />
        </div>
      );

    case 'score':
      return (
        <div className={`flex flex-col items-center gap-4 py-8 ${className}`}>
          <div className="skeleton w-44 h-44 rounded-full" />
          <div className="skeleton h-6 w-32 rounded-full" />
        </div>
      );

    case 'text':
    default:
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-4 rounded"
              style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
          ))}
        </div>
      );
  }
}

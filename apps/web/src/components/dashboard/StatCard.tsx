interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  variant?: 'default' | 'alert';
}

export function StatCard({ title, value, change, changeType = 'up', icon, variant = 'default' }: StatCardProps) {
  const isAlert = variant === 'alert';

  return (
    <div className={`card animate-slide-up ${isAlert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isAlert ? 'text-red-600' : 'text-gray-500'} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold tabular-nums ${isAlert ? 'text-red-700' : 'text-gray-900'}`}>
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 font-medium ${
              changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isAlert ? 'bg-red-100' : 'bg-emerald-100'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

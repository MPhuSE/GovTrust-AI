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
    <div className={`relative overflow-hidden rounded-xl border bg-white p-6 transition-all duration-200 hover:shadow-md ${
      isAlert ? 'border-red-200 shadow-sm' : 'border-gray-200/75 shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold tracking-wide ${isAlert ? 'text-red-600' : 'text-slate-500'} mb-2`}>
            {title}
          </p>
          <p className={`text-3xl font-bold tracking-tight tabular-nums ${isAlert ? 'text-red-700' : 'text-slate-900'}`}>
            {value}
          </p>
          {change && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center rounded-full p-1 ${
                changeType === 'up' ? 'bg-emerald-100/50 text-emerald-600' : 
                changeType === 'down' ? 'bg-red-100/50 text-red-600' : 
                'bg-slate-100 text-slate-600'
              }`}>
                {changeType === 'up' ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : changeType === 'down' ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
                )} 
              </span>
              <span className={`text-xs font-medium ${
                changeType === 'up' ? 'text-emerald-700' : 
                changeType === 'down' ? 'text-red-700' : 
                'text-slate-500'
              }`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isAlert ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

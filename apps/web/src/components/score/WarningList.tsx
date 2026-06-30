interface LawGuardAlert {
  type: string;
  message: string;
  confidence: number;
  legalSource?: { title: string; article: string; url?: string };
  needsVerification?: boolean;
}

export function WarningList({ alerts }: { alerts: LawGuardAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="card">
      <h3 className="mb-3">Cảnh báo pháp lý (LawGuard)</h3>
      <ul className="space-y-3">
        {alerts.map((alert, i) => (
          <li key={i} className={`rounded-lg p-3 text-sm ${alert.type === 'WARNING' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
            <p className="font-medium mb-1">{alert.message}</p>
            {alert.legalSource && (
              <p className="text-gray-500 text-xs">
                Nguồn: {alert.legalSource.title} — {alert.legalSource.article}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">Độ tin cậy: {Math.round(alert.confidence * 100)}%</span>
              {alert.needsVerification && (
                <span className="text-xs text-yellow-700 font-medium">⚠ Cần kiểm tra thêm</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-3">
        Thông tin pháp lý chỉ mang tính tham khảo, không phải tư vấn pháp lý chính thức.
      </p>
    </div>
  );
}

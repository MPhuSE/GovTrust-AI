'use client';

interface HeatMapChartProps {
  data: number[][];
  xLabels: string[];
  yLabels: string[];
}

const getColor = (value: number): string => {
  if (value >= 25) return 'bg-red-500 text-white';
  if (value >= 15) return 'bg-red-300 text-white';
  if (value >= 10) return 'bg-orange-300 text-gray-900';
  if (value >= 5) return 'bg-yellow-200 text-gray-900';
  return 'bg-gray-100 text-gray-600';
};

export function HeatMapChart({ data, xLabels, yLabels }: HeatMapChartProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Dịch vụ \ Lỗi</th>
            {xLabels.map((label) => (
              <th key={label} className="text-center py-2 px-2 font-medium text-gray-500 text-xs">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((yLabel, yi) => (
            <tr key={yLabel} className="border-t border-gray-100">
              <td className="py-2 px-3 font-medium text-gray-700 text-xs whitespace-nowrap">
                {yLabel}
              </td>
              {xLabels.map((_, xi) => {
                const value = data[yi]?.[xi] || 0;
                return (
                  <td key={xi} className="py-2 px-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-8 rounded text-xs font-bold ${getColor(value)}`}
                    >
                      {value}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-3 justify-end text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Thấp</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200" /></span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-300" /></span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Cao</span>
      </div>
    </div>
  );
}

'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: Array<{ _id: string; count: number; avgScore: number }>;
}

export function TrendLine({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgScore"
          stroke="#2563EB"
          strokeWidth={2.5}
          dot={false}
          name="Điểm TB"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="count"
          stroke="#9CA3AF"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Lượng HS"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

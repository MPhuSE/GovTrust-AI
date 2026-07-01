'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: Array<{ _id: string; count: number; avgScore: number }>;
}

export function TrendLine({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} name="Số lỗi" />
      </LineChart>
    </ResponsiveContainer>
  );
}

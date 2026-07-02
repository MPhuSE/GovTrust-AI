'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { proceduresApi, sessionsApi } from '@/lib/api-client';
import { Disclaimer } from '@/components/ui/Disclaimer';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = (await proceduresApi.identify(query)) as any as { procedureId?: string };
      if (result.procedureId) {
        const session = (await sessionsApi.create(result.procedureId)) as any as { _id: string };
        router.push(`/upload/${session._id}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-blue-800 mb-3">GovTrust AI</h1>
          <p className="text-gray-600 text-lg">
            Kiểm tra hồ sơ dịch vụ công trước khi nộp — phát hiện lỗi ngay tại nhà
          </p>
        </div>

        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bạn cần làm thủ tục gì?
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder='Ví dụ: "Tôi muốn đăng ký khai sinh cho con" hoặc "Cấp đổi CCCD"'
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button
            className="btn-primary w-full mt-4 text-base py-3"
            onClick={handleStart}
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'Đang xử lý...' : 'Bắt đầu kiểm tra hồ sơ'}
          </button>
        </div>

        <div className="mt-6">
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}

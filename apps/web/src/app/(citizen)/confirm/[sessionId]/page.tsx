'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api-client';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface SessionSummary {
  score: number;
  grade: string;
  warningCount: number;
  formFieldsFilled: number;
  formFieldsTotal: number;
  procedureName?: string;
}

export default function ConfirmPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((session: unknown) => {
        const s = session as {
          aiResult?: {
            score?: { score: number; grade: string; breakdown: unknown[] };
            crossCheck?: { summary: { mismatches: number; missing: number } };
          };
          procedure?: { name: string };
        };
        const scoreData = s.aiResult?.score;
        const crossCheck = s.aiResult?.crossCheck;
        setSummary({
          score: scoreData?.score || 0,
          grade: scoreData?.grade || 'D',
          warningCount: (crossCheck?.summary?.mismatches || 0) + (crossCheck?.summary?.missing || 0),
          formFieldsFilled: 8,
          formFieldsTotal: 10,
          procedureName: s.procedure?.name,
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [sessionId]);

  const handleConfirm = async () => {
    setShowModal(false);
    setIsConfirming(true);
    try {
      await sessionsApi.confirm(sessionId);
      setIsConfirmed(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" />
        </div>
      </CitizenLayout>
    );
  }

  if (isConfirmed) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Hồ sơ đã được xác nhận!</h1>
          <p className="text-gray-500 mb-2">
            Hồ sơ của bạn đã được ghi nhận. Vui lòng mang bản gốc giấy tờ đến bộ phận một cửa để hoàn tất thủ tục.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Mã phiên: <span className="font-mono-num">{sessionId}</span>
          </p>

          <div className="flex gap-3 justify-center">
            <button className="btn-secondary" onClick={() => router.push('/')}>
              Về trang chủ
            </button>
          </div>

          <div className="mt-8">
            <TrustSignal message="Dữ liệu phiên sẽ tự động xóa sau 24 giờ" />
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {/* Progress */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Bước 5/5: Xác nhận hồ sơ</p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-700 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận hồ sơ</h1>
        <p className="text-gray-500 text-sm mb-8">
          Vui lòng kiểm tra lại toàn bộ thông tin trước khi xác nhận.
        </p>

        {/* Summary Card */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tóm tắt hồ sơ</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{summary?.score}</p>
              <p className="text-xs text-gray-500">Điểm hồ sơ</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary?.warningCount}</p>
              <p className="text-xs text-gray-500">Cảnh báo</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {summary?.formFieldsFilled}/{summary?.formFieldsTotal}
              </p>
              <p className="text-xs text-gray-500">Trường đã điền</p>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className="card mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Tôi đã kiểm tra và xác nhận thông tin trên là chính xác. Tôi hiểu rằng kết quả kiểm tra chỉ mang tính tham khảo và quyết định cuối cùng thuộc cơ quan có thẩm quyền.
            </span>
          </label>
        </div>

        <Disclaimer text="Thông tin trên chỉ mang tính tham khảo. AI không ra quyết định hành chính. Quyết định cuối cùng thuộc cơ quan có thẩm quyền." />

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => router.back()}>
            Quay lại
          </button>
          <button
            className="btn-primary flex-1"
            disabled={!checked || isConfirming}
            onClick={() => setShowModal(true)}
          >
            {isConfirming ? 'Đang xác nhận...' : 'Xác nhận hồ sơ'}
          </button>
        </div>

        <div className="mt-4">
          <TrustSignal />
        </div>
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận hồ sơ?</h3>
              <p className="text-sm text-gray-500">
                Bạn chắc chắn muốn xác nhận hồ sơ này? Sau khi xác nhận, bạn có thể mang bản gốc đến bộ phận một cửa.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                Hủy
              </button>
              <button className="btn-primary flex-1" onClick={handleConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </CitizenLayout>
  );
}

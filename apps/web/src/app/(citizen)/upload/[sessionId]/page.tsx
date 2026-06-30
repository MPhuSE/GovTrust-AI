'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { documentsApi, scoringApi, smartformApi, sessionsApi, proceduresApi } from '@/lib/api-client';
import { UploadZone } from '@/components/upload/UploadZone';
import { Progress } from '@/components/ui/Progress';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const CITIZEN_STEPS = ['Chọn thủ tục', 'Tải giấy tờ', 'Kết quả', 'Xác nhận TT', 'Hoàn tất'];

interface ChecklistItem {
  documentTypeCode: string;
  label: string;
  required: boolean;
  hint?: string;
}

export default function UploadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { fileName: string; preview?: string }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [loadingChecklist, setLoadingChecklist] = useState(true);

  // Load session and procedure checklist
  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then(async (session: unknown) => {
        const s = session as { procedureId?: string; procedure?: { name: string; code: string } };
        if (s.procedure) {
          setProcedureName(s.procedure.name);
          try {
            const proc = (await proceduresApi.get(s.procedure.code)) as unknown as {
              checklist?: ChecklistItem[];
            };
            if (proc.checklist) {
              setChecklist(proc.checklist);
              setLoadingChecklist(false);
              return;
            }
          } catch {
            /* fallback */
          }
        }
        // Fallback checklist
        setChecklist([
          { documentTypeCode: 'CCCD', label: 'CCCD / CMND', required: true, hint: 'Mặt trước, nằm ngang, đủ ánh sáng' },
          { documentTypeCode: 'GIAY_CHUNG_SINH', label: 'Giấy chứng sinh', required: true, hint: 'Do cơ sở y tế cấp' },
          { documentTypeCode: 'GIAY_DANG_KY_KET_HON', label: 'Giấy chứng nhận kết hôn', required: false, hint: 'Nếu cha mẹ đã đăng ký kết hôn' },
        ]);
        setLoadingChecklist(false);
      })
      .catch(() => {
        setChecklist([
          { documentTypeCode: 'CCCD', label: 'CCCD / CMND', required: true },
          { documentTypeCode: 'GIAY_CHUNG_SINH', label: 'Giấy chứng sinh', required: true },
        ]);
        setLoadingChecklist(false);
      });
  }, [sessionId]);

  const handleUpload = async (file: File, documentTypeCode: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('documentTypeCode', documentTypeCode);
    await documentsApi.upload(formData);

    // Create preview
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setUploadedDocs((prev) => ({
      ...prev,
      [documentTypeCode]: { fileName: file.name, preview },
    }));
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    try {
      setStatusMsg('Đang bóc tách thông tin từ giấy tờ...');
      for (const docCode of Object.keys(uploadedDocs)) {
        await documentsApi.triggerOcr(sessionId, docCode);
      }

      setStatusMsg('Đang kiểm tra chéo thông tin...');
      await scoringApi.crosscheck(sessionId);

      setStatusMsg('Đang chấm điểm hồ sơ...');
      await scoringApi.score(sessionId);

      setStatusMsg('Đang tra cứu căn cứ pháp lý...');
      await scoringApi.lawguard(sessionId);

      setStatusMsg('Đang chuẩn bị form tự điền...');
      await smartformApi.generate(sessionId);

      router.push(`/result/${sessionId}`);
    } catch (e) {
      setStatusMsg(`Lỗi: ${(e as Error).message}`);
      setIsProcessing(false);
    }
  };

  const requiredUploaded = checklist.filter((c) => c.required).every((c) => uploadedDocs[c.documentTypeCode]);

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {procedureName || 'Tải lên giấy tờ'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">Bước 2: Tải lên tài liệu đính kèm</p>

        {/* Progress */}
        <div className="mb-8">
          <Progress steps={CITIZEN_STEPS} currentIndex={1} totalLabel="2 / 5" />
        </div>

        {/* Photo guide */}
        <div className="info-box mb-6">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold mb-1">Hướng dẫn chụp ảnh tài liệu</p>
              <ul className="text-sm space-y-0.5 text-blue-700">
                <li>• Đặt tài liệu trên mặt phẳng tối màu, đủ ánh sáng.</li>
                <li>• Đảm bảo không bị lóa sáng (flash) hoặc bóng che khuất.</li>
                <li>• Chụp thẳng góc, thấy rõ 4 mép của tài liệu.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Checklist Upload Zones */}
        {loadingChecklist ? (
          <div className="space-y-4">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        ) : (
          <div className="space-y-4">
            {checklist.map((item) => {
              const uploaded = uploadedDocs[item.documentTypeCode];

              return (
                <div key={item.documentTypeCode} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {item.label}
                        {item.required ? (
                          <span className="badge-required">Bắt buộc</span>
                        ) : (
                          <span className="badge-optional">Không bắt buộc</span>
                        )}
                      </h3>
                      {item.hint && <p className="text-xs text-gray-500 mt-0.5">{item.hint}</p>}
                    </div>
                    {uploaded && <span className="badge-success">✓ Đã tải lên</span>}
                  </div>

                  {uploaded ? (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      {uploaded.preview && (
                        <img
                          src={uploaded.preview}
                          alt={item.label}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{uploaded.fileName}</p>
                      </div>
                      <button
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium shrink-0"
                        onClick={() => {
                          setUploadedDocs((prev) => {
                            const next = { ...prev };
                            delete next[item.documentTypeCode];
                            return next;
                          });
                        }}
                      >
                        Đổi ảnh
                      </button>
                    </div>
                  ) : (
                    <UploadZone
                      onUpload={(file) => handleUpload(file, item.documentTypeCode)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Processing status */}
        {statusMsg && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {statusMsg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => router.back()} disabled={isProcessing}>
            Lưu nháp
          </button>
          <button
            className="btn-primary flex-1"
            onClick={handleRunPipeline}
            disabled={isProcessing || !requiredUploaded}
          >
            {isProcessing ? 'Đang phân tích...' : 'Kiểm tra ngay →'}
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <Disclaimer />
          <TrustSignal />
        </div>
      </div>
    </CitizenLayout>
  );
}

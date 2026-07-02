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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0A192F] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0A192F] mb-2 tracking-tight">
          {procedureName || 'Tải lên giấy tờ'}
        </h1>
        <p className="text-gray-500 text-base font-medium mb-8">Bước 2: Hệ thống AI sẽ tự động trích xuất thông tin</p>

        {/* Progress */}
        <div className="mb-10">
          <Progress steps={CITIZEN_STEPS} currentIndex={1} totalLabel="2 / 5" />
        </div>

        {/* Photo guide */}
        <div className="bg-emerald-50/50 backdrop-blur-sm border border-emerald-100/60 rounded-2xl p-5 mb-8 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-emerald-700 font-bold">i</span>
          </div>
          <div>
            <p className="font-bold text-[#0A192F] mb-1.5">Mẹo chụp ảnh để AI nhận diện tốt nhất</p>
            <ul className="text-sm space-y-1 text-emerald-800/80 font-medium">
              <li>• Đặt giấy tờ trên mặt phẳng tối màu, nơi có đủ ánh sáng.</li>
              <li>• Giữ điện thoại song song với giấy tờ, lấy trọn 4 góc.</li>
              <li>• Tránh lóa sáng (flash) hoặc bóng đen che khuất chữ.</li>
            </ul>
          </div>
        </div>

        {/* Checklist Upload Zones */}
        {loadingChecklist ? (
          <div className="space-y-4">
            <LoadingSkeleton variant="card" className="rounded-2xl" />
            <LoadingSkeleton variant="card" className="rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {checklist.map((item) => {
              const uploaded = uploadedDocs[item.documentTypeCode];

              return (
                <div key={item.documentTypeCode} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[#0A192F] text-lg flex items-center gap-2">
                        {item.label}
                        {item.required ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">Bắt buộc</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">Tùy chọn</span>
                        )}
                      </h3>
                      {item.hint && <p className="text-sm text-gray-500 mt-1 font-medium">{item.hint}</p>}
                    </div>
                    {uploaded && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                        ✓ Đã tải lên
                      </span>
                    )}
                  </div>

                  {uploaded ? (
                    <div className="flex items-center gap-4 bg-[#FBFBFA] rounded-xl p-3 border border-gray-100">
                      {uploaded.preview && (
                        <img
                          src={uploaded.preview}
                          alt={item.label}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{uploaded.fileName}</p>
                      </div>
                      <button
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-bold shrink-0 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50"
                        onClick={() => {
                          setUploadedDocs((prev) => {
                            const next = { ...prev };
                            delete next[item.documentTypeCode];
                            return next;
                          });
                        }}
                      >
                        Đổi file
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
          <div className="mt-8 bg-cyan-50/50 backdrop-blur-md border border-cyan-100 rounded-xl p-4 text-cyan-800 text-sm font-semibold flex items-center gap-3 animate-slide-up shadow-sm">
            <svg className="w-5 h-5 animate-spin text-cyan-600 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {statusMsg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button 
            className="px-6 py-4 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
            onClick={() => router.back()} 
            disabled={isProcessing}
          >
            Lưu nháp
          </button>
          <button
            className="px-6 py-4 rounded-xl font-bold bg-[#0A192F] text-white hover:bg-[#112240] transition-all flex-[2] text-center shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleRunPipeline}
            disabled={isProcessing || !requiredUploaded}
          >
            {isProcessing ? 'AI đang phân tích...' : 'AI Kiểm tra ngay →'}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <Disclaimer />
          <TrustSignal />
        </div>
      </div>
    </CitizenLayout>
  );
}

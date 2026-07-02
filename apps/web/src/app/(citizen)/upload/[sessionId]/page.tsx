'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { documentsApi, scoringApi, smartformApi, sessionsApi } from '@/lib/api-client';
import { Progress } from '@/components/ui/Progress';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const CITIZEN_STEPS = ['Chọn thủ tục', 'Tải giấy tờ', 'Kết quả', 'Xác nhận TT', 'Hoàn tất'];

// Khớp với procedure.schema.ts (backend)
interface BackendChecklistItem {
  id: string;
  documentTypeCode: string;
  label?: string;
  isRequired: boolean;          // ← backend dùng isRequired, không phải required
  roleInProcedure?: string;
  conditionalOn?: string;
  inputMode?: 'UPLOAD' | 'EKYC' | 'REFERENCE';
}

interface ChecklistItem {
  id: string;
  documentTypeCode: string;
  label: string;
  required: boolean;
  hint?: string;
  inputMode?: string;
}

// Procedure đã populate từ Mongoose
interface PopulatedProcedure {
  _id: string;
  name: string;
  code: string;
  checklist?: BackendChecklistItem[];
}

// ─── Camera với màn xem lại ảnh (tái sử dụng pattern từ register) ──────────
const CameraCapture = ({
  onConfirm,
  onCancel,
  label,
}: {
  onConfirm: (file: File) => void;
  onCancel: () => void;
  label: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState('');
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);

  useEffect(() => {
    if (preview) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCamError('Không thể truy cập máy ảnh. Vui lòng kiểm tra quyền trình duyệt.'));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [preview]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      if (videoRef.current?.srcObject)
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setPreview({ url: URL.createObjectURL(blob), file });
    }, 'image/jpeg', 0.9);
  };

  // ── Màn xem lại ──
  if (preview) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={preview.url} alt="Ảnh vừa chụp" className="max-w-full max-h-full object-contain rounded" />
        </div>
        <div className="bg-black px-6 pt-4 pb-10 border-t border-gray-800">
          <p className="text-white/60 text-sm text-center mb-4 font-medium">Kiểm tra ảnh <span className="text-white font-bold">{label}</span> trước khi dùng</p>
          <div className="flex gap-3">
            <button
              onClick={() => setPreview(null)}
              className="flex-1 py-3.5 rounded border border-gray-600 text-white font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Chụp lại
            </button>
            <button
              onClick={() => onConfirm(preview.file)}
              className="flex-[2] py-3.5 rounded bg-gray-500 hover:bg-teal-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Dùng ảnh này
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Màn live camera ──
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {camError ? (
          <div className="text-white p-6 text-center">
            <svg className="w-14 h-14 text-red-400 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="font-bold text-lg">{camError}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            {/* Khung CCCD nằm ngang */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative z-20 w-[88vw] max-w-[600px] aspect-[8.5/5.4] rounded border-2 border-teal-600 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-600 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-600 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-600 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-600 rounded-br-lg" />
                <span className="absolute inset-0 flex items-center justify-center text-white/40 font-bold tracking-widest text-xs uppercase">
                  Đưa giấy tờ vào khung hình
                </span>
              </div>
            </div>
            <p className="absolute top-8 left-0 right-0 text-center text-white font-bold z-20 drop-shadow-md">{label}</p>
          </>
        )}
      </div>
      <div className="bg-black p-6 flex justify-between items-center pb-10 border-t border-gray-800 z-20">
        <button onClick={onCancel} className="text-white font-bold px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors">Hủy</button>
        <button
          onClick={handleCapture}
          disabled={!!camError}
          className="w-20 h-20 bg-gray-500 rounded-full border-[6px] border-white active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center shadow-xl"
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <div className="w-16" />
      </div>
    </div>
  );
};

// ─── Upload Page ────────────────────────────────────────────────────────────
export default function UploadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { fileName: string; preview?: string }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [loadingChecklist, setLoadingChecklist] = useState(true);

  // Slot đã được điền sẵn từ hồ sơ eKYC (source === EKYC_PROFILE) — key theo checklist item.id
  const [prefilledSlots, setPrefilledSlots] = useState<Record<string, { cccdNumber?: string }>>({});

  // Camera state
  const [cameraField, setCameraField] = useState<ChecklistItem | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Chuyển schema backend → ChecklistItem frontend ──
  const mapChecklist = (raw: BackendChecklistItem[]): ChecklistItem[] =>
    raw
      .filter(item => item.inputMode !== 'REFERENCE') // bỏ loại REFERENCE (pre-filled)
      .map(item => ({
        id: item.id,
        documentTypeCode: item.documentTypeCode,
        label: item.label || item.documentTypeCode,
        required: item.isRequired,           // isRequired → required
        hint: item.roleInProcedure,
        inputMode: item.inputMode,
      }));

  // ── Load session → procedure (đã populate) → checklist ──
  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((session: unknown) => {
        // Mongoose populate: procedureId là object sau khi GET /sessions/:id
        const s = session as {
          procedureId?: PopulatedProcedure | string;
          aiResult?: {
            ocrData?: Record<string, {
              source?: string;
              fields?: { soCCCD?: { value?: string } };
            }>;
          };
        };

        // Đọc các slot đã điền sẵn từ hồ sơ eKYC (backend gán khi tạo session)
        const ocrData = s.aiResult?.ocrData ?? {};
        const prefilled: Record<string, { cccdNumber?: string }> = {};
        for (const [slotId, slot] of Object.entries(ocrData)) {
          if (slot?.source === 'EKYC_PROFILE') {
            prefilled[slotId] = { cccdNumber: slot.fields?.soCCCD?.value };
          }
        }
        if (Object.keys(prefilled).length > 0) setPrefilledSlots(prefilled);

        const proc =
          s.procedureId && typeof s.procedureId === 'object'
            ? (s.procedureId as PopulatedProcedure)
            : null;

        if (proc) {
          setProcedureName(proc.name);
          if (proc.checklist && proc.checklist.length > 0) {
            setChecklist(mapChecklist(proc.checklist));
            setLoadingChecklist(false);
            return;
          }
        }

        // Fallback khi chưa có procedure data (lỗi populate / dev)
        setChecklist([
          { id: 'cccd', documentTypeCode: 'CCCD', label: 'CCCD / CMND', required: true, hint: 'Mặt trước, nằm ngang, đủ ánh sáng' },
          { id: 'chung_sinh', documentTypeCode: 'GIAY_CHUNG_SINH', label: 'Giấy chứng sinh', required: true, hint: 'Do cơ sở y tế cấp' },
        ]);
        setLoadingChecklist(false);
      })
      .catch(() => {
        setChecklist([
          { id: 'cccd', documentTypeCode: 'CCCD', label: 'CCCD / CMND', required: true },
        ]);
        setLoadingChecklist(false);
      });
  }, [sessionId]);

  // ── Xử lý file (từ file input hoặc camera confirm) ──
  const handleFile = useCallback(async (file: File, documentTypeCode: string) => {
    if (file.size > 10 * 1024 * 1024) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('documentTypeCode', documentTypeCode);
    await documentsApi.upload(formData);
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setUploadedDocs(prev => ({ ...prev, [documentTypeCode]: { fileName: file.name, preview } }));
  }, [sessionId]);

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    try {
      setStatusMsg('Đang bóc tách thông tin từ giấy tờ...');
      for (const docCode of Object.keys(uploadedDocs))
        await documentsApi.triggerOcr(sessionId, docCode);

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

  // Slot thỏa mãn nếu: đã upload file, HOẶC đã điền sẵn từ hồ sơ eKYC.
  const isSlotSatisfied = (item: ChecklistItem) =>
    !!uploadedDocs[item.documentTypeCode] || !!prefilledSlots[item.id];
  const requiredUploaded = checklist.filter(c => c.required).every(isSlotSatisfied);

  return (
    <>
      {/* Camera modal toàn màn hình */}
      {cameraField && (
        <CameraCapture
          label={cameraField.label}
          onConfirm={async (file) => {
            setCameraField(null);
            await handleFile(file, cameraField.documentTypeCode);
          }}
          onCancel={() => setCameraField(null)}
        />
      )}

      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-700 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          {/* Title — hiển thị tên thủ tục thật từ backend */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-700 mb-2 tracking-tight">
            {procedureName || (loadingChecklist ? '...' : 'Tải lên giấy tờ')}
          </h1>
          <p className="text-gray-500 text-base font-medium mb-8">Bước 2: Hệ thống AI sẽ tự động trích xuất thông tin</p>

          <div className="mb-10">
            <Progress steps={CITIZEN_STEPS} currentIndex={1} totalLabel="2 / 5" />
          </div>

          {/* Mẹo chụp ảnh */}
          <div className="bg-gray-50/50 -sm border border-teal-600/60 rounded-md p-5 mb-8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-emerald-700 font-bold">i</span>
            </div>
            <div>
              <p className="font-bold text-teal-700 mb-1.5">Mẹo chụp ảnh để AI nhận diện tốt nhất</p>
              <ul className="text-sm space-y-1 text-emerald-800/80 font-medium">
                <li>• Đặt giấy tờ trên mặt phẳng tối màu, nơi có đủ ánh sáng.</li>
                <li>• Giữ điện thoại song song với giấy tờ, lấy trọn 4 góc.</li>
                <li>• Tránh lóa sáng (flash) hoặc bóng đen che khuất chữ.</li>
              </ul>
            </div>
          </div>

          {/* Checklist */}
          {loadingChecklist ? (
            <div className="space-y-4">
              <LoadingSkeleton variant="card" className="rounded-md" />
              <LoadingSkeleton variant="card" className="rounded-md" />
            </div>
          ) : (
            <div className="space-y-6">
              {checklist.map((item) => {
                const uploaded = uploadedDocs[item.documentTypeCode];
                const prefilled = prefilledSlots[item.id];
                return (
                  <div
                    key={item.documentTypeCode}
                    className={`rounded-md p-6 border shadow-[0_4px_20px_rgb(0,0,0,0.02)] ${
                      prefilled ? 'bg-gray-50/40 border-teal-600' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-teal-700 text-lg flex items-center gap-2">
                          {item.label}
                          {item.required ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">Bắt buộc</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">Tùy chọn</span>
                          )}
                        </h3>
                        {item.hint && <p className="text-sm text-gray-500 mt-1 font-medium">{item.hint}</p>}
                      </div>
                      {prefilled ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-teal-600 flex items-center gap-1 shrink-0">
                          ✓ Từ hồ sơ eKYC
                        </span>
                      ) : uploaded ? (
                        <span className="px-3 py-1 bg-gray-50 text-emerald-700 text-xs font-bold rounded-full border border-teal-600 flex items-center gap-1">
                          ✓ Đã tải lên
                        </span>
                      ) : null}
                    </div>

                    {prefilled ? (
                      // Slot đã điền sẵn từ hồ sơ eKYC — không cần upload lại
                      <div className="flex items-center gap-4 bg-white rounded p-4 border border-teal-600">
                        <div className="w-11 h-11 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-teal-700">Danh tính đã xác minh</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {prefilled.cccdNumber
                              ? `CCCD ${prefilled.cccdNumber} — lấy tự động từ hồ sơ cá nhân`
                              : 'Thông tin lấy tự động từ hồ sơ cá nhân đã eKYC'}
                          </p>
                        </div>
                        <span className="text-xs text-teal-600 font-bold shrink-0">Không cần upload</span>
                      </div>
                    ) : uploaded ? (
                      // Hiện preview + nút đổi file
                      <div className="flex items-center gap-4 bg-gray-50 rounded p-3 border border-gray-100">
                        {uploaded.preview && (
                          <img
                            src={uploaded.preview}
                            alt={item.label}
                            className="w-20 h-14 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{uploaded.fileName}</p>
                        </div>
                        <button
                          className="text-sm text-teal-600 hover:text-emerald-800 font-bold shrink-0 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                          onClick={() =>
                            setUploadedDocs(prev => {
                              const next = { ...prev };
                              delete next[item.documentTypeCode];
                              return next;
                            })
                          }
                        >
                          Đổi file
                        </button>
                      </div>
                    ) : (
                      // Upload / Camera buttons
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* File upload */}
                        <label className="flex flex-col items-center justify-center gap-2 p-5 rounded border-2 border-dashed border-gray-300 hover:border-teal-600 hover:bg-gray-50/30 transition-all cursor-pointer text-gray-700">
                          <input
                            ref={el => { fileRefs.current[item.documentTypeCode] = el; }}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={async e => {
                              const f = e.target.files?.[0];
                              if (f) await handleFile(f, item.documentTypeCode);
                            }}
                          />
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-sm">Tải tệp lên</span>
                            <span className="block text-xs text-gray-500 mt-0.5">PDF, JPG, PNG (Max 10MB)</span>
                          </div>
                        </label>

                        {/* Camera — mở CameraCapture fullscreen */}
                        <button
                          onClick={() => setCameraField(item)}
                          className="flex flex-col items-center justify-center gap-2 p-5 rounded border-2 border-teal-600 bg-gray-50 hover:bg-emerald-100/50 hover:border-teal-600 transition-all text-emerald-800"
                        >
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <span className="block font-bold text-sm">Chụp ảnh ngay</span>
                            <span className="block text-xs font-medium opacity-80 mt-0.5">Có khung căn chỉnh + xem lại</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Processing status */}
          {statusMsg && (
            <div className="mt-8 bg-cyan-50/50 -md border border-cyan-100 rounded p-4 text-cyan-800 text-sm font-semibold flex items-center gap-3 animate-slide-up shadow-sm">
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
              className="px-6 py-4 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
              onClick={() => router.back()}
              disabled={isProcessing}
            >
              Lưu nháp
            </button>
            <button
              className="px-6 py-4 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all flex-[2] text-center shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
    </>
  );
}

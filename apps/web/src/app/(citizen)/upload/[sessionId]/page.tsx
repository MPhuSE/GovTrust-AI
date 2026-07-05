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

// DEMO: mỗi documentTypeCode có 1..n ảnh mẫu (kèm chú thích) trong /public/samples.
// Manifest mô tả các biến thể (hợp lệ / sai lệch) để giám khảo chọn nhanh, khỏi tìm file.
interface SampleVariant {
  file: string;
  label: string;
  desc: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}
type SampleManifest = Record<string, SampleVariant[]>;

const SAMPLE_TONE: Record<SampleVariant['tone'], { dot: string; badge: string }> = {
  good: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warn: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  bad: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
  neutral: { dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600 border-gray-200' },
};

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
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { fileName: string; preview?: string; documentTypeCode: string }>>({});
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [loadingChecklist, setLoadingChecklist] = useState(true);

  // Slot đã được điền sẵn từ hồ sơ eKYC (source === EKYC_PROFILE) — key theo checklist item.id
  const [prefilledSlots, setPrefilledSlots] = useState<Record<string, { cccdNumber?: string }>>({});

  // Camera state
  const [cameraField, setCameraField] = useState<ChecklistItem | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Slot đang được kéo file qua (để highlight dropzone) — key theo checklist item.id
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // DEMO: manifest ảnh mẫu + slot đang mở picker chọn biến thể
  const [sampleManifest, setSampleManifest] = useState<SampleManifest>({});
  const [samplePickerSlot, setSamplePickerSlot] = useState<string | null>(null);

  useEffect(() => {
    fetch('/samples/manifest.json')
      .then(r => (r.ok ? r.json() : {}))
      .then((m: SampleManifest) => setSampleManifest(m))
      .catch(() => setSampleManifest({}));
  }, []);

  // ── Chuyển schema backend → ChecklistItem frontend ──
  const mapChecklist = (raw: BackendChecklistItem[]): ChecklistItem[] =>
    raw
      .filter(item => item.inputMode !== 'REFERENCE') // bỏ loại REFERENCE (pre-filled)
      .filter(item => item.inputMode !== 'EKYC')       // bỏ loại EKYC (đã xác thực từ tài khoản)
      .map(item => ({
        id: item.id,
        documentTypeCode: item.documentTypeCode,
        label: item.label || item.documentTypeCode,
        required: item.isRequired ?? (item as any).required ?? false,
        hint: item.roleInProcedure,
        inputMode: item.inputMode,
      }));

  // ── Load session → procedure (đã populate) → checklist + AI consultation ──
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
              documentTypeCode?: string;
              fields?: { soCCCD?: { value?: string } };
            }>;
          };
        };

        // Đọc các slot đã điền sẵn từ hồ sơ eKYC (backend gán khi tạo session)
        const ocrData = s.aiResult?.ocrData ?? {};
        const prefilled: Record<string, { cccdNumber?: string }> = {};
        // Khôi phục các slot ĐÃ upload trước đó (quay lại hồ sơ nháp không bị mất).
        // Ảnh gốc đã xoá theo data-minimization nên không có preview, chỉ đánh dấu "đã tải lên".
        const restored: Record<string, { fileName: string; preview?: string; documentTypeCode: string }> = {};
        for (const [slotId, slot] of Object.entries(ocrData)) {
          if (slot?.source === 'EKYC_PROFILE') {
            prefilled[slotId] = { cccdNumber: slot.fields?.soCCCD?.value };
          } else if (slot?.fields && Object.keys(slot.fields).length > 0) {
            restored[slotId] = {
              fileName: 'Giấy tờ đã tải lên trước đó',
              documentTypeCode: slot.documentTypeCode ?? '',
            };
          }
        }
        if (Object.keys(prefilled).length > 0) setPrefilledSlots(prefilled);
        if (Object.keys(restored).length > 0) setUploadedDocs(prev => ({ ...restored, ...prev }));

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

  // ── Xử lý file (từ file input, kéo-thả hoặc camera confirm) ──
  const handleFile = useCallback(async (file: File, documentTypeCode: string, checklistId: string) => {
    // Kéo-thả bỏ qua thuộc tính accept của input → phải tự kiểm tra loại + kích thước.
    const isAllowedType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowedType) {
      setStatusMsg('Chỉ chấp nhận tệp ảnh (JPG, PNG) hoặc PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatusMsg('Tệp vượt quá 10MB, vui lòng chọn tệp nhỏ hơn.');
      return;
    }
    setStatusMsg('');
    // OCR chạy inline ở backend (~3-4s/ảnh) → bật loading cho slot này để user không tưởng treo
    setUploadingSlots(prev => ({ ...prev, [checklistId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('documentTypeCode', documentTypeCode);
      formData.append('checklistId', checklistId);
      await documentsApi.upload(formData);
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      setUploadedDocs(prev => ({ ...prev, [checklistId]: { fileName: file.name, preview, documentTypeCode } }));
    } catch (e) {
      // Ảnh sai loại giấy tờ (422) hoặc lỗi upload khác: báo rõ, KHÔNG đánh dấu slot đã
      // upload (setUploadedDocs không chạy vì throw trước) → buộc người dùng chọn ảnh khác.
      setStatusMsg((e as Error).message || 'Không tải được ảnh. Vui lòng thử lại với ảnh khác.');
    } finally {
      setUploadingSlots(prev => {
        const next = { ...prev };
        delete next[checklistId];
        return next;
      });
    }
  }, [sessionId]);

  // ── DEMO: ảnh mẫu sẵn có trong /public/samples/<docType>/<file>.
  // Cho phép giám khảo nạp thẳng ảnh mẫu vào slot mà không cần chọn file từ máy.
  const loadSample = useCallback(async (documentTypeCode: string, checklistId: string, file: string) => {
    setSamplePickerSlot(null);
    setStatusMsg('');
    setUploadingSlots(prev => ({ ...prev, [checklistId]: true }));
    try {
      const res = await fetch(`/samples/${documentTypeCode}/${file}`);
      if (!res.ok) throw new Error('Chưa có ảnh mẫu cho loại giấy tờ này.');
      const blob = await res.blob();
      const f = new File([blob], `mau-${documentTypeCode}-${file}`, { type: 'image/jpeg' });
      // handleFile tự bật lại uploadingSlots nên xoá cờ tạm ở đây để tránh kẹt.
      setUploadingSlots(prev => { const n = { ...prev }; delete n[checklistId]; return n; });
      await handleFile(f, documentTypeCode, checklistId);
    } catch (e) {
      setUploadingSlots(prev => { const n = { ...prev }; delete n[checklistId]; return n; });
      setStatusMsg((e as Error).message || 'Không tải được ảnh mẫu.');
    }
  }, [handleFile]);

  // = queued → processing → done|failed. Phải chờ 'done' trước khi enqueue bước kế
  // vì chúng phụ thuộc nhau: score cần crossCheck xong, smartform cần score xong.
  const waitForStep = async (step: string, label: string) => {
    setStatusMsg(label);
    for (let attempts = 0; attempts < 60; attempts++) { // ~2 phút timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      const session = await sessionsApi.get(sessionId) as any;
      const status = session.pipeline?.steps?.[step];
      if (status === 'done') return;
      if (status === 'failed') throw new Error(`Bước "${label}" thất bại, vui lòng thử lại`);
    }
    throw new Error(`Bước "${label}" quá thời gian chờ`);
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    try {
      // OCR đã chạy inline khi upload từng file — bỏ qua bước triggerOcr riêng

      await scoringApi.crosscheck(sessionId);
      await waitForStep('crosscheck', 'Đang kiểm tra chéo thông tin...');

      await scoringApi.score(sessionId);
      await waitForStep('score', 'Đang chấm điểm hồ sơ...');

      await scoringApi.lawguard(sessionId);
      await waitForStep('lawguard', 'Đang tra cứu căn cứ pháp lý...');

      await smartformApi.generate(sessionId);
      await waitForStep('smartform', 'Đang chuẩn bị form tự điền...');

      router.push(`/result/${sessionId}`);
    } catch (e) {
      setStatusMsg(`Lỗi: ${(e as Error).message}`);
      setIsProcessing(false);
    }
  };

  // Slot thỏa mãn nếu: đã upload file, HOẶC đã điền sẵn từ hồ sơ eKYC.
  const isSlotSatisfied = (item: ChecklistItem) =>
    !!uploadedDocs[item.id] || !!prefilledSlots[item.id];
  const requiredUploaded = checklist.filter(c => c.required).every(isSlotSatisfied);

  return (
    <>
      {/* Camera modal toàn màn hình */}
      {cameraField && (
        <CameraCapture
          label={cameraField.label}
          onConfirm={async (file) => {
            setCameraField(null);
            await handleFile(file, cameraField.documentTypeCode, cameraField.id);
          }}
          onCancel={() => setCameraField(null)}
        />
      )}

      <CitizenLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-teal-700 mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>

          {/* Title — hiển thị tên thủ tục thật từ backend */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-700 mb-1 tracking-tight">
            {procedureName || (loadingChecklist ? '...' : 'Tải lên giấy tờ')}
          </h1>
          <p className="text-gray-500 text-sm font-medium mb-4">Bước 2: Hệ thống AI sẽ tự động trích xuất thông tin</p>

          <div className="mb-6">
            <Progress steps={CITIZEN_STEPS} currentIndex={1} />
          </div>

          {/* Checklist */}
          {loadingChecklist ? (
            <div className="space-y-4">
              <LoadingSkeleton variant="card" className="rounded-md" />
              <LoadingSkeleton variant="card" className="rounded-md" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {checklist.map((item) => {
                const uploaded = uploadedDocs[item.id];
                const prefilled = prefilledSlots[item.id];
                const uploading = uploadingSlots[item.id];
                return (
                  <div
                    key={item.id}
                    className={`rounded-md p-4 border shadow-[0_4px_20px_rgb(0,0,0,0.02)] ${
                      prefilled ? 'bg-gray-50/40 border-teal-600' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-teal-700 text-base flex items-center gap-2 flex-wrap">
                          {item.label}
                          {item.required ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider">Bắt buộc</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">Nếu có</span>
                          )}
                        </h3>
                        {item.hint && <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.hint}</p>}
                      </div>
                      {prefilled ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-teal-600 flex items-center gap-1 shrink-0">
                          ✓ Từ hồ sơ eKYC
                        </span>
                      ) : uploading ? (
                        <span className="px-3 py-1 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-full border border-cyan-200 flex items-center gap-1.5">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          AI đang đọc…
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
                    ) : uploading ? (
                      // Đang upload + OCR inline — animation để user biết AI đang xử lý
                      <div className="flex items-center gap-4 rounded-lg p-5 border border-cyan-100 bg-gradient-to-r from-cyan-50/60 to-teal-50/40 overflow-hidden relative">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" style={{ backgroundSize: '200% 100%' }} />
                        <div className="w-11 h-11 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 relative z-10">
                          <svg className="w-6 h-6 text-cyan-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                          <p className="text-sm font-bold text-cyan-800">AI đang trích xuất thông tin…</p>
                          <p className="text-xs text-cyan-600/80 font-medium mt-0.5">Đang đọc giấy tờ, giữ nguyên trang trong giây lát</p>
                        </div>
                        <div className="flex items-center gap-1 relative z-10 shrink-0">
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
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
                              delete next[item.id];
                              return next;
                            })
                          }
                        >
                          Đổi file
                        </button>
                      </div>
                    ) : (
                      // Kéo-thả hoặc bấm để chọn tệp
                      <label
                        onDragOver={e => {
                          e.preventDefault();
                          if (dragOverSlot !== item.id) setDragOverSlot(item.id);
                        }}
                        onDragLeave={e => {
                          e.preventDefault();
                          // Chỉ bỏ highlight khi rời hẳn vùng dropzone (không phải sang con)
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSlot(null);
                        }}
                        onDrop={async e => {
                          e.preventDefault();
                          setDragOverSlot(null);
                          const f = e.dataTransfer.files?.[0];
                          if (f) await handleFile(f, item.documentTypeCode, item.id);
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border-2 border-dashed transition-all cursor-pointer text-gray-700 w-full ${
                          dragOverSlot === item.id
                            ? 'border-teal-600 bg-teal-50/60 scale-[1.01]'
                            : 'border-gray-300 hover:border-teal-600 hover:bg-teal-50/30'
                        }`}
                      >
                        <input
                          ref={el => { fileRefs.current[item.documentTypeCode] = el; }}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={async e => {
                            const f = e.target.files?.[0];
                            if (f) await handleFile(f, item.documentTypeCode, item.id);
                          }}
                        />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          dragOverSlot === item.id ? 'bg-teal-200' : 'bg-teal-100'
                        }`}>
                          <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-sm text-gray-900">
                            {dragOverSlot === item.id ? 'Thả tệp vào đây' : 'Kéo thả hoặc bấm để tải tệp'}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">PDF, JPG, PNG (Max 10MB)</span>
                        </div>
                      </label>
                    )}

                    {/* DEMO: nạp nhanh ảnh mẫu (nhiều biến thể kèm chú thích) */}
                    {!prefilled && !uploaded && !uploading && (sampleManifest[item.documentTypeCode]?.length ?? 0) > 0 && (() => {
                      const variants = sampleManifest[item.documentTypeCode];
                      const open = samplePickerSlot === item.id;
                      return (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => setSamplePickerSlot(open ? null : item.id)}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 text-sm font-extrabold shadow-sm hover:border-amber-400 hover:from-amber-100 hover:to-yellow-100 hover:shadow-md transition-all"
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Dùng ảnh mẫu
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wide">Demo</span>
                            <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {open && (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/40 divide-y divide-amber-100 overflow-hidden">
                              {variants.map(v => {
                                const tone = SAMPLE_TONE[v.tone];
                                return (
                                  <button
                                    key={v.file}
                                    type="button"
                                    onClick={() => loadSample(item.documentTypeCode, item.id, v.file)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-white transition-colors flex gap-2.5 items-start"
                                  >
                                    <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />
                                    <span className="min-w-0">
                                      <span className="block text-sm font-bold text-gray-800">{v.label}</span>
                                      <span className="block text-xs text-gray-500 mt-0.5 leading-snug">{v.desc}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* Trạng thái: đang chạy pipeline → spinner cyan; ngược lại → thông báo lỗi amber */}
          {statusMsg && (
            isProcessing ? (
              <div className="mt-6 bg-cyan-50/50 border border-cyan-100 rounded p-4 text-cyan-800 text-sm font-semibold flex items-center gap-3 animate-slide-up shadow-sm">
                <svg className="w-5 h-5 animate-spin text-cyan-600 shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {statusMsg}
              </div>
            ) : (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded p-4 text-amber-800 text-sm font-semibold flex items-center gap-3 animate-slide-up shadow-sm">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {statusMsg}
              </div>
            )
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              className="px-6 py-3.5 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
              onClick={() => router.back()}
              disabled={isProcessing}
            >
              Lưu nháp
            </button>
            <button
              className="px-6 py-3.5 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all flex-[2] text-center shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleRunPipeline}
              disabled={isProcessing || !requiredUploaded}
            >
              {isProcessing ? 'AI đang phân tích...' : 'AI Kiểm tra ngay →'}
            </button>
          </div>

          <div className="mt-5">
            <TrustSignal />
          </div>
        </div>
      </CitizenLayout>
    </>
  );
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';

type Step = 'info' | 'front' | 'back' | 'selfie' | 'verifying' | 'done';

interface EkycOcrField { value: string; confidence: number }

interface EkycResult {
  verified: boolean;
  ocrFields: Record<string, EkycOcrField>;
  faceMatch: boolean;
  faceMatchProb: number;
  liveness: boolean;
  warnings: string[];
}

const STEP_META: Record<string, { num: number; title: string; desc: string }> = {
  info:   { num: 1, title: 'Thông tin tài khoản', desc: 'Nhập thông tin cơ bản' },
  front:  { num: 2, title: 'CCCD mặt trước', desc: 'Cung cấp ảnh mặt trước CCCD' },
  back:   { num: 3, title: 'CCCD mặt sau', desc: 'Cung cấp ảnh mặt sau CCCD' },
  selfie: { num: 4, title: 'Ảnh chân dung', desc: 'Cung cấp ảnh selfie để đối chiếu' },
};

// ─── Camera với màn xem lại ảnh sau khi chụp ──────────────────────────────
const CameraCapture = ({
  onConfirm,
  onCancel,
  facingMode,
  stepType,
}: {
  onConfirm: (file: File) => void;
  onCancel: () => void;
  facingMode: 'environment' | 'user';
  stepType: 'cccd' | 'selfie';
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState('');
  // preview = data URL sau khi chụp, null = đang live
  const [preview, setPreview] = useState<{ url: string; file: File } | null>(null);

  useEffect(() => {
    if (preview) return; // camera không cần thiết khi đang xem preview
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCamError('Không thể truy cập máy ảnh. Vui lòng kiểm tra quyền.'));
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [facingMode, preview]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      // Dừng stream rồi hiện preview để xem lại
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setPreview({ url: URL.createObjectURL(blob), file });
    }, 'image/jpeg', 0.9);
  };

  // ── Màn xem lại ảnh đã chụp ──
  if (preview) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
          <img
            src={preview.url}
            alt="Ảnh vừa chụp"
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
        <div className="bg-black px-6 pt-4 pb-10 border-t border-gray-800">
          <p className="text-white/60 text-sm text-center mb-4 font-medium">
            Kiểm tra ảnh trước khi dùng
          </p>
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {camError ? (
          <div className="text-white p-4 text-center z-10">
            <svg className="w-16 h-16 text-red-500 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="font-bold text-lg">{camError}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative z-20">
                {stepType === 'cccd' ? (
                  <div className="w-[85vw] max-w-[600px] aspect-[8.5/5.4] rounded border-2 border-teal-600 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] bg-transparent relative flex items-center justify-center">
                    <span className="text-white/60 font-bold tracking-widest text-sm uppercase opacity-50 absolute">Đưa CCCD vào khung hình</span>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-600 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-600 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-600 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-600 rounded-br-lg" />
                  </div>
                ) : (
                  <div className="w-[65vw] max-w-[350px] aspect-[3/4] rounded-[50%] border-2 border-teal-600 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] bg-transparent relative flex items-center justify-center">
                    <span className="text-white/60 font-bold tracking-widest text-sm uppercase opacity-50 absolute top-1/3">Khuôn mặt</span>
                  </div>
                )}
              </div>
            </div>
            <p className="absolute top-8 left-0 right-0 text-center text-white font-bold z-20 drop-shadow-md">
              {stepType === 'cccd' ? 'Chụp CCCD' : 'Chụp ảnh chân dung'}
            </p>
          </>
        )}
      </div>
      <div className="bg-black p-6 flex justify-between items-center pb-10 border-t border-gray-800 relative z-20">
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

// ─── Register Page ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState({ fullName: '', password: '', confirmPassword: '' });
  const [files, setFiles] = useState<{ front: File | null; back: File | null; selfie: File | null }>({ front: null, back: null, selfie: null });
  const [previews, setPreviews] = useState<{ front: string; back: string; selfie: string }>({ front: '', back: '', selfie: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ekycResult, setEkycResult] = useState<EkycResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraField, setActiveCameraField] = useState<'front' | 'back' | 'selfie' | null>(null);

  // Nhận file (từ camera sau confirm hoặc từ file input) — KHÔNG auto-advance
  const handleFile = useCallback((key: 'front' | 'back' | 'selfie', file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError('File quá lớn (tối đa 10MB)'); return; }
    setFiles(p => ({ ...p, [key]: file }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
    setError(null);
    setIsCameraOpen(false);
    setActiveCameraField(null);
    // Không auto-advance: user tự bấm "Tiếp tục" sau khi thấy preview
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.fullName.trim().length < 1) { setError('Vui lòng nhập họ tên'); return; }
    if (form.password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }

    // Validate password strength
    const hasUpperCase = /[A-Z]/.test(form.password);
    const hasLowerCase = /[a-z]/.test(form.password);
    const hasNumber = /\d/.test(form.password);
    const hasSpecialChar = /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]/.test(form.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
      return;
    }

    if (form.password !== form.confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    setStep('front');
  };

  const handleSubmitEkyc = async () => {
    if (!files.front || !files.back || !files.selfie) { setError('Vui lòng cung cấp đủ 3 ảnh'); return; }
    setError(null);
    setIsSubmitting(true);
    setStep('verifying');

    const fd = new FormData();
    // username sẽ được backend tự động điền từ CCCD number
    fd.append('password', form.password);
    fd.append('fullName', form.fullName);
    fd.append('front', files.front);
    fd.append('back', files.back);
    fd.append('selfie', files.selfie);

    try {
      const result = (await authApi.registerWithEkyc(fd)) as unknown as {
        access_token: string;
        user: { id: string; username: string; fullName: string; role: string };
        ekyc: EkycResult;
      };

      // Lưu token
      localStorage.setItem('govtrust_token', result.access_token);

      // Lưu profile đầy đủ — bao gồm các trường CCCD trích xuất từ eKYC
      const ocrFields = result.ekyc?.ocrFields ?? {};
      const profile = {
        ...result.user,
        // Thông tin CCCD từ backend (khớp với user.schema.ts)
        cccdNumber:       ocrFields.cccdNumber?.value       ?? null,
        cccdFullName:     ocrFields.fullName?.value         ?? null,
        cccdBirthDay:     ocrFields.birthDay?.value         ?? null,
        cccdGender:       ocrFields.gender?.value           ?? null,
        cccdNationality:  ocrFields.nationality?.value      ?? null,
        cccdOriginLocation: ocrFields.originLocation?.value ?? null,
        cccdRecentLocation: ocrFields.recentLocation?.value ?? null,
        cccdValidDate:    ocrFields.validDate?.value        ?? null,
        // eKYC meta
        kycStatus:        result.ekyc?.verified ? 'VERIFIED' : 'FAILED',
        kycFaceMatch:     result.ekyc?.faceMatch ?? false,
        kycFaceMatchProb: result.ekyc?.faceMatchProb ?? 0,
      };
      localStorage.setItem('govtrust_user', JSON.stringify(profile));

      setEkycResult(result.ekyc);
      setStep('done');
    } catch (e) {
      setError((e as Error).message || 'Xác minh thất bại. Vui lòng thử lại.');
      setStep('selfie');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepKeys = ['info', 'front', 'back', 'selfie'] as const;

  // ── Stepper bar ──
  const Stepper = () => (
    <div className="flex items-center justify-center gap-1 mb-8">
      {stepKeys.map((s, i) => {
        const meta = STEP_META[s];
        const isActive = step === s;
        const isPast = meta.num < (STEP_META[step]?.num || 99);
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
              isPast ? 'bg-gray-500 text-white' : isActive ? 'bg-teal-700 text-white ring-4 ring-[#0A192F]/10' : 'bg-gray-100 text-gray-400'
            }`}>
              {isPast ? '✓' : meta.num}
            </div>
            {i < stepKeys.length - 1 && <div className={`w-8 h-0.5 rounded transition-colors ${isPast ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
          </div>
        );
      })}
    </div>
  );

  // ── Photo upload card ──
  const PhotoStep = ({ fieldKey, icon, accept }: { fieldKey: 'front' | 'back' | 'selfie'; icon: string; accept: string }) => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h2 className="text-xl font-extrabold text-teal-700">{STEP_META[fieldKey].title}</h2>
        <p className="text-sm text-gray-500 font-medium mt-1">{STEP_META[fieldKey].desc}</p>
      </div>

      {/* Preview ảnh đã chọn — có nút xoá để chụp/chọn lại */}
      {previews[fieldKey] ? (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={previews[fieldKey]}
              alt={fieldKey}
              className="w-full max-h-64 object-contain rounded-md border border-teal-600 bg-gray-50"
            />
            <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Đã chọn
            </div>
            <button
              onClick={() => {
                setFiles(p => ({ ...p, [fieldKey]: null }));
                setPreviews(p => ({ ...p, [fieldKey]: '' }));
              }}
              className="absolute top-3 right-3 w-9 h-9 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              title="Chọn lại"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 font-medium">
            Ảnh rõ nét? Bấm <span className="text-teal-700 font-bold">Tiếp tục</span> — hoặc bấm ✕ để chọn lại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mở camera */}
          <button
            onClick={() => { setActiveCameraField(fieldKey); setIsCameraOpen(true); }}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border-2 border-teal-600 bg-gray-50 hover:bg-emerald-100/50 hover:border-teal-600 transition-all text-emerald-800"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="block font-bold text-sm">Mở máy ảnh</span>
              <span className="block text-xs font-medium opacity-80 mt-1">Chụp có khung + xem lại</span>
            </div>
          </button>

          {/* Upload file */}
          <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-gray-700 cursor-pointer">
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(fieldKey, f); }}
            />
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <span className="block font-bold text-sm">Tải file lên</span>
              <span className="block text-xs font-medium opacity-80 mt-1">JPG, PNG (max 10MB)</span>
            </div>
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setStep(fieldKey === 'front' ? 'info' : fieldKey === 'back' ? 'front' : 'back')}
          className="flex-1 py-3.5 rounded border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
        >
          ← Quay lại
        </button>

        {fieldKey === 'selfie' ? (
          <button
            onClick={handleSubmitEkyc}
            disabled={!files.front || !files.back || !files.selfie || isSubmitting}
            className="flex-[2] py-3.5 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors disabled:opacity-40 shadow-md"
          >
            Xác minh & Đăng ký
          </button>
        ) : (
          <button
            onClick={() => setStep(fieldKey === 'front' ? 'back' : 'selfie')}
            disabled={!files[fieldKey]}
            className="flex-[2] py-3.5 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors disabled:opacity-40 shadow-md"
          >
            Tiếp tục →
          </button>
        )}
      </div>
    </div>
  );

  // ── Verifying spinner ──
  if (step === 'verifying') {
    return (
      <Shell>
        <div className="text-center py-12">
          <div className="w-20 h-20 border-4 border-teal-600 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-extrabold text-teal-700 mb-2">Đang xác minh danh tính...</h2>
          <p className="text-sm text-gray-500 font-medium">AI đang đối chiếu CCCD và khuôn mặt. Vui lòng chờ trong giây lát.</p>
        </div>
      </Shell>
    );
  }

  // ── Done ──
  if (step === 'done' && ekycResult) {
    const fields = ekycResult.ocrFields || {};
    return (
      <Shell>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-teal-700 mb-1">Đăng ký thành công!</h2>
          <p className="text-sm text-gray-500 font-medium">Danh tính đã được xác minh qua eKYC</p>
        </div>

        {/* Thông tin CCCD đã lưu vào profile */}
        <div className="bg-gray-50 rounded-md border border-gray-100 p-5 mb-4 space-y-2.5 text-sm">
          <h3 className="font-bold text-teal-700 text-base mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs">✓</span>
            Thông tin đã lưu vào hồ sơ cá nhân
          </h3>
          {([
            ['Số CCCD',       fields.cccdNumber],
            ['Họ tên',        fields.fullName],
            ['Ngày sinh',     fields.birthDay],
            ['Giới tính',     fields.gender],
            ['Quốc tịch',     fields.nationality],
            ['Quê quán',      fields.originLocation],
            ['Nơi ĐKTT',      fields.recentLocation],
            ['Có giá trị đến',fields.validDate],
          ] as [string, EkycOcrField | undefined][]).map(([label, f]) => {
            if (!f?.value) return null;
            return (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="font-bold text-teal-700">{f.value}</span>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-200 flex justify-between items-center mt-3">
            <span className="text-gray-500 font-medium">Đối chiếu khuôn mặt</span>
            <span className={`font-extrabold ${ekycResult.faceMatch ? 'text-teal-600' : 'text-red-500'}`}>
              {ekycResult.faceMatch
                ? `✓ Khớp (${Math.round(ekycResult.faceMatchProb * 100)}%)`
                : '✗ Không khớp'}
            </span>
          </div>
        </div>

        {ekycResult.warnings?.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded p-3 mb-4 text-xs text-amber-700 font-medium space-y-1">
            {ekycResult.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
          </div>
        )}

        <button
          onClick={() => router.push('/')}
          className="w-full py-4 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md"
        >
          Bắt đầu sử dụng →
        </button>
      </Shell>
    );
  }

  // ── Main form flow ──
  return (
    <>
      {isCameraOpen && activeCameraField && (
        <CameraCapture
          facingMode={activeCameraField === 'selfie' ? 'user' : 'environment'}
          stepType={activeCameraField === 'selfie' ? 'selfie' : 'cccd'}
          onConfirm={(file) => handleFile(activeCameraField, file)}
          onCancel={() => { setIsCameraOpen(false); setActiveCameraField(null); }}
        />
      )}
      <Shell>
        <Stepper />

        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-5">
            <div className="text-center mb-2">
              <h2 className="text-xl font-extrabold text-teal-700">Tạo tài khoản công dân</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Xác minh danh tính bằng CCCD gắn chip</p>
            </div>
            <Field id="fullName" label="Họ và Tên" placeholder="NGUYEN VAN A" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))} />
            <Field id="password" label="Mật khẩu" placeholder="••••••••" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} autoComplete="new-password" hint="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt" />
            <Field id="confirmPassword" label="Xác nhận mật khẩu" placeholder="••••••••" type="password" value={form.confirmPassword} onChange={v => setForm(p => ({ ...p, confirmPassword: v }))} autoComplete="new-password" />
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 font-medium">
              💡 Tên đăng nhập sẽ là số CCCD của bạn sau khi xác thực
            </div>
            <button type="submit" className="w-full py-4 rounded bg-teal-700 hover:bg-teal-800 text-white font-bold transition-all shadow-md mt-2">
              Tiếp tục chụp CCCD →
            </button>
          </form>
        )}

        {step === 'front'  && <PhotoStep fieldKey="front"  icon="🪪" accept="image/*" />}
        {step === 'back'   && <PhotoStep fieldKey="back"   icon="🔄" accept="image/*" />}
        {step === 'selfie' && <PhotoStep fieldKey="selfie" icon="🤳" accept="image/*" />}

        {error && (
          <div className="mt-4 bg-red-50/80 border border-red-100 rounded p-4 text-red-600 text-sm font-medium flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs">✕</span>
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-gray-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-teal-600 font-bold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </Shell>
    </>
  );
}

// ── Shell ──────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <CitizenLayout>
      <div className="bg-gray-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-teal-600 border border-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm relative overflow-hidden">
            <span className="text-gold-500 font-extrabold text-2xl">★</span>
          </div>
          <h1 className="text-2xl font-extrabold text-teal-700 tracking-tight">
            Cổng Dịch Vụ Công <span className="text-teal-700">AI</span>
          </h1>
        </div>
        <div className="bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
          {children}
        </div>
      </div>
    </div>
    </CitizenLayout>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({ id, label, hint, ...props }: {
  id: string; label: string; hint?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        id={id}
        type={props.type || 'text'}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        required
        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all outline-none text-gray-900 placeholder-gray-400 font-medium"
      />
      {hint && <p className="text-xs text-gray-400 mt-1.5 font-medium">{hint}</p>}
    </div>
  );
}

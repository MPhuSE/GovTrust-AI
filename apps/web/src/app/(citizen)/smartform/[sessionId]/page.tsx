'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, smartformApi } from '@/lib/api-client';
import { Progress } from '@/components/ui/Progress';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const CITIZEN_STEPS = ['Chọn thủ tục', 'Tải giấy tờ', 'Kết quả', 'Xác nhận TT', 'Hoàn tất'];

interface FormField {
  key: string;
  label: string;
  value: string;
  source: 'ocr' | 'manual' | 'auto';
  editable: boolean;
  required?: boolean;
  hint?: string;
}

interface SmartFormData {
  autoFilledFields: FormField[];
  manualFields: FormField[];
  procedureName?: string;
}

export default function SmartFormPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<SmartFormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((session: unknown) => {
        const s = session as { aiResult?: { smartForm?: SmartFormData } };
        if (s.aiResult?.smartForm) {
          setFormData(s.aiResult.smartForm);
          // Initialize form values
          const values: Record<string, string> = {};
          [...(s.aiResult.smartForm.autoFilledFields || []), ...(s.aiResult.smartForm.manualFields || [])].forEach((f) => {
            values[f.key] = f.value || '';
          });
          setFormValues(values);
        } else {
          // Fallback demo data
          const demo: SmartFormData = {
            autoFilledFields: [
              { key: 'fullName', label: 'Họ và tên', value: 'NGUYỄN VĂN A', source: 'ocr', editable: false },
              { key: 'dob', label: 'Ngày sinh', value: '15/08/1985', source: 'ocr', editable: false },
              { key: 'cccd', label: 'Số CCCD', value: '001085123456', source: 'ocr', editable: false },
              { key: 'address', label: 'Địa chỉ thường trú', value: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', source: 'ocr', editable: false },
            ],
            manualFields: [
              { key: 'childName', label: 'Họ và tên con', value: '', source: 'manual', editable: true, required: true, hint: 'Viết hoa chữ cái đầu của mỗi từ (Ví dụ: Nguyễn Văn B)' },
              { key: 'childDob', label: 'Ngày sinh con', value: '', source: 'manual', editable: true, required: true },
            ],
          };
          setFormData(demo);
          const values: Record<string, string> = {};
          [...demo.autoFilledFields, ...demo.manualFields].forEach((f) => {
            values[f.key] = f.value || '';
          });
          setFormValues(values);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [sessionId]);

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      // Save form values to backend before proceeding
      await smartformApi.render(sessionId, formValues);
    } catch {
      // If render fails (e.g. backend not ready), continue anyway
    }
    setIsSaving(false);
    router.push(`/confirm/${sessionId}`);
  };

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" className="rounded-md" />
          <LoadingSkeleton variant="card" className="mt-6 rounded-md" />
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
        {/* Progress */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-gray-500 mb-2">Bước 4/5: Xác nhận thông tin</p>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                <div className="h-full bg-teal-700 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <span className="text-sm text-teal-700 font-bold ml-4">80% Hoàn thành</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-700 mb-3 tracking-tight">
          Kiểm tra thông tin hồ sơ
        </h1>
        <p className="text-gray-500 text-base font-medium mb-10 leading-relaxed">
          Hệ thống AI đã tự động bóc tách và điền thông tin từ giấy tờ của bạn. Vui lòng rà soát lại và bổ sung các trường còn thiếu (nếu có).
        </p>

        {/* Auto-filled Section */}
        {formData?.autoFilledFields && formData.autoFilledFields.length > 0 && (
          <div className="bg-white rounded-md p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-teal-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <span className="text-emerald-700">👤</span>
                </div>
                Dữ liệu trích xuất tự động
              </h2>
              <span className="px-3 py-1.5 bg-gray-50 text-emerald-700 text-xs font-bold rounded-full border border-teal-600 flex items-center gap-1.5 shrink-0 w-max">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
                </span>
                AI Đã xác thực
              </span>
            </div>

            <div className="space-y-5">
              {formData.autoFilledFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formValues[field.key] || field.value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      disabled={!field.editable}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded focus:outline-none text-gray-900 font-medium pr-10"
                      readOnly={!field.editable}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Section */}
        {formData?.manualFields && formData.manualFields.length > 0 && (
          <div className="bg-white rounded-md p-6 sm:p-8 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-8">
            <h2 className="text-lg font-bold text-teal-700 flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-200">
                <span className="text-gray-500">✏️</span>
              </div>
              Thông tin cần bổ sung (Nhập tay)
            </h2>

            <div className="space-y-5">
              {formData.manualFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 focus:outline-none transition-all text-gray-900 font-medium placeholder-gray-400"
                    required={field.required}
                  />
                  {field.hint && <p className="text-sm font-medium text-gray-500 mt-2">{field.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <button 
            className="px-6 py-4 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
            onClick={() => router.back()}
          >
            Quay lại
          </button>
          <button 
            className="px-6 py-4 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all flex-[2] text-center shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Tiếp tục xác nhận →'}
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

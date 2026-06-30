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

  const handleContinue = () => {
    router.push(`/confirm/${sessionId}`);
  };

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" className="mt-4" />
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {/* Progress */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">Bước 4/5: Xác nhận thông tin</p>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <span className="text-sm text-blue-600 font-semibold ml-3">80% Hoàn thành</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Kiểm tra thông tin hồ sơ
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Hệ thống AI đã tự động điền thông tin từ giấy tờ tùy thân của bạn. Vui lòng kiểm tra kỹ và bổ sung thông tin còn thiếu.
        </p>

        {/* Auto-filled Section */}
        {formData?.autoFilledFields && formData.autoFilledFields.length > 0 && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span>👤</span>
                Thông tin công dân (Tự động)
              </h2>
              <span className="badge-info flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                AI Auto-filled
              </span>
            </div>

            <div className="space-y-4">
              {formData.autoFilledFields.map((field) => (
                <div key={field.key}>
                  <label className="input-label">{field.label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formValues[field.key] || field.value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      disabled={!field.editable}
                      className="input-field input-success pr-10"
                      readOnly={!field.editable}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="card mb-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <span>✏️</span>
              Thông tin cần bổ sung (Nhập tay)
            </h2>

            <div className="space-y-4">
              {formData.manualFields.map((field) => (
                <div key={field.key}>
                  <label className="input-label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    className="input-field"
                    required={field.required}
                  />
                  {field.hint && <p className="input-hint">{field.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => router.back()}>
            Quay lại
          </button>
          <button className="btn-primary flex-1" onClick={handleContinue}>
            Tiếp tục xác nhận →
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

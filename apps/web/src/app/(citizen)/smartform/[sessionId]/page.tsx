'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, smartformApi } from '@/lib/api-client';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface FormField {
  key: string;
  label: string;
  value: string;
  source: 'ocr' | 'manual' | 'auto' | 'user';
  editable: boolean;
  required?: boolean;
  hint?: string;
  filled?: boolean;
}

interface SmartFormData {
  autoFilledFields: FormField[];
  manualFields: FormField[];
  fields?: FormField[]; // danh sách hợp nhất theo thứ tự template (backend mới)
  procedureName?: string;
}

// Prefix của field key → tiêu đề nhóm hiển thị. Bao trùm 3 thủ tục MVP.
const SECTION_TITLES: Record<string, string> = {
  // Đăng ký khai sinh
  nguoiYeuCau: 'Người yêu cầu',
  treEm: 'Thông tin trẻ em',
  phuHuynh2: 'Phụ huynh còn lại',
  ketHon: 'Giấy chứng nhận kết hôn',
  // Thay đổi chủ hộ kinh doanh
  hoKinhDoanh: 'Hộ kinh doanh',
  chuHoCu: 'Chủ hộ trước khi thay đổi',
  chuHoMoi: 'Chủ hộ sau khi thay đổi',
  thayDoi: 'Nội dung thay đổi',
  // Chuyển nhượng QSDĐ
  benNhan: 'Bên nhận chuyển nhượng (người kê khai)',
  thuaDat: 'Thông tin thửa đất',
  benChuyen: 'Bên chuyển nhượng',
  hopDong: 'Thông tin giao dịch',
  congTrinh: 'Nhà ở, công trình xây dựng',
};

const GENERAL_SECTION = 'Thông tin chung';

// Field dài (địa chỉ, nơi chốn, ghi chú...) chiếm cả 2 cột cho dễ đọc.
const WIDE_FIELD_HINTS = [
  'diaChi', 'noiCuTru', 'noiThuongTru', 'noiSinh', 'noiCap', 'noiDangKy', 'noiCongChung',
  'queQuan', 'email', 'noiDung', 'lyDo', 'deNghiKhac', 'chiTieuKhac', 'coQuan',
];
const isWideField = (key: string) => {
  const leaf = key.includes('.') ? key.split('.').slice(1).join('.') : key;
  return WIDE_FIELD_HINTS.some((h) => leaf.toLowerCase().includes(h.toLowerCase()));
};

// Leaf key (phần sau dấu chấm) để nhận diện loại field cho validation.
const fieldLeaf = (key: string) => (key.includes('.') ? key.split('.').slice(1).join('.') : key).toLowerCase();

// Giới tính chỉ có 2 giá trị hợp lệ → render bằng dropdown thay vì ô nhập tự do.
const GENDER_OPTIONS = ['Nam', 'Nữ'];
const isGenderField = (key: string) => fieldLeaf(key).includes('gioitinh');

// Field boolean (vd "Đăng ký công trình xây dựng") lưu dạng chuỗi 'true'/'false'
// (renderer DOCX cần để bật conditional). Render dropdown Có/Không thay vì hiện "false" trơ.
const isBooleanField = (key: string) => fieldLeaf(key) === 'dangky';

// Các leaf key là ngày tháng — validate định dạng DD/MM/YYYY.
const DATE_LEAVES = ['ngaysinh', 'ngaycap', 'ngayky', 'ngaydangky', 'hansudung', 'ngayhethan'];

/**
 * Validate định dạng 1 field theo loại (suy từ leaf key). Trả message lỗi tiếng Việt
 * hoặc null nếu hợp lệ. Bỏ qua ô rỗng — để check "bắt buộc" lo riêng.
 */
function validateField(key: string, rawValue: string): string | null {
  const value = (rawValue ?? '').trim();
  if (!value) return null;
  const leaf = fieldLeaf(key);

  if (leaf.includes('gioitinh')) {
    return GENDER_OPTIONS.includes(value) ? null : 'Giới tính chỉ nhận Nam hoặc Nữ';
  }
  if (leaf === 'socccd' || leaf.includes('socccd')) {
    return /^\d{12}$/.test(value.replace(/\s/g, '')) ? null : 'Số CCCD phải gồm đúng 12 chữ số';
  }
  if (leaf.includes('email')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Email không đúng định dạng';
  }
  if (leaf.includes('dienthoai')) {
    return /^0\d{9}$/.test(value.replace(/\s/g, '')) ? null : 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0';
  }
  if (DATE_LEAVES.includes(leaf)) {
    return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value) ? null : 'Ngày phải theo định dạng DD/MM/YYYY';
  }
  return null;
}

interface FormSection {
  title: string;
  fields: FormField[];
}

// Gom field theo prefix key (phần trước dấu chấm) và giữ nguyên thứ tự template.
function groupIntoSections(fields: FormField[]): FormSection[] {
  const order: string[] = [];
  const byTitle = new Map<string, FormField[]>();
  for (const f of fields) {
    const prefix = f.key.includes('.') ? f.key.split('.')[0] : '';
    const title = SECTION_TITLES[prefix] ?? GENERAL_SECTION;
    if (!byTitle.has(title)) {
      byTitle.set(title, []);
      order.push(title);
    }
    byTitle.get(title)!.push(f);
  }
  return order.map((title) => ({ title, fields: byTitle.get(title)! }));
}

export default function SmartFormPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<SmartFormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const applyForm = (smartForm: SmartFormData) => {
      setFormData(smartForm);
      const values: Record<string, string> = {};
      const all =
        smartForm.fields && smartForm.fields.length > 0
          ? smartForm.fields
          : [...(smartForm.autoFilledFields || []), ...(smartForm.manualFields || [])];
      all.forEach((f) => {
        values[f.key] = f.value || '';
      });
      setFormValues(values);
    };

    const readSession = async (): Promise<{
      status?: string;
      canSubmit?: boolean;
      hasScore: boolean;
      smartForm: SmartFormData | null;
    }> => {
      const session = (await sessionsApi.get(sessionId)) as unknown as {
        status?: string;
        aiResult?: { smartForm?: SmartFormData; score?: { canSubmit?: boolean } };
      };
      return {
        status: session.status,
        canSubmit: session.aiResult?.score?.canSubmit,
        hasScore: Boolean(session.aiResult?.score),
        smartForm: session.aiResult?.smartForm ?? null,
      };
    };

    // Hồ sơ đã nộp → không cho sửa lại form, chuyển sang trang theo dõi (chỉ đọc).
    const SUBMITTED = new Set(['CONFIRMED', 'RECHECKED', 'REJECTED']);

    const load = async () => {
      try {
        // 0) Đã nộp → khoá chỉnh sửa, đưa về /track.
        const first = await readSession();
        if (cancelled) return;
        if (first.status && SUBMITTED.has(first.status)) {
          router.replace(`/track/${sessionId}`);
          return;
        }

        // 0b) Đã chấm điểm nhưng KHÔNG đạt (sai lệch chéo / điểm thấp) → chặn điền form,
        //     đưa về trang kết quả để người dùng sửa lỗi. Chỉ chặn khi đã có score;
        //     chưa chấm thì để đi tiếp (luồng cũ vẫn generate form được).
        if (first.hasScore && first.canSubmit === false) {
          router.replace(`/result/${sessionId}`);
          return;
        }

        // 1) Đã có sẵn từ pipeline (consumer chạy SmartFormService) → dùng ngay.
        let smartForm = first.smartForm;

        // 2) Chưa có → chủ động yêu cầu sinh rồi poll tới khi backend ghi xong.
        if (!smartForm) {
          try {
            await smartformApi.generate(sessionId);
          } catch {
            // generate 202 hoặc lỗi tạm — vẫn thử poll bên dưới.
          }
          for (let attempt = 0; attempt < 8 && !smartForm; attempt++) {
            await new Promise((r) => setTimeout(r, 1500));
            if (cancelled) return;
            smartForm = (await readSession()).smartForm;
          }
        }

        if (cancelled) return;
        if (smartForm) {
          applyForm(smartForm);
        } else {
          setLoadError('Chưa tạo được biểu mẫu tự điền. Vui lòng thử lại sau ít phút.');
        }
      } catch {
        if (!cancelled) setLoadError('Không tải được biểu mẫu. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Danh sách trường hợp nhất theo thứ tự template (fallback nếu backend cũ).
  const unifiedFields = useMemo<FormField[]>(() => {
    if (!formData) return [];
    if (formData.fields && formData.fields.length > 0) return formData.fields;
    return [...(formData.autoFilledFields || []), ...(formData.manualFields || [])];
  }, [formData]);

  const sections = useMemo(() => groupIntoSections(unifiedFields), [unifiedFields]);

  const aiFilledCount = useMemo(
    () => unifiedFields.filter((f) => f.filled ?? Boolean(f.value)).length,
    [unifiedFields],
  );

  const handleFieldChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Kiểm tra required còn trống — chặn tải nếu thiếu.
  const missingRequired = useMemo(
    () => unifiedFields.filter((f) => f.required && !(formValues[f.key] ?? '').trim()),
    [unifiedFields, formValues],
  );

  // Lỗi định dạng theo từng field (giới tính, CCCD, email, điện thoại, ngày).
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const f of unifiedFields) {
      const err = validateField(f.key, formValues[f.key] ?? '');
      if (err) errors[f.key] = err;
    }
    return errors;
  }, [unifiedFields, formValues]);

  const invalidFields = useMemo(
    () => unifiedFields.filter((f) => fieldErrors[f.key]),
    [unifiedFields, fieldErrors],
  );

  const handleContinue = async () => {
    setFormError(null);
    // Chặn đi tiếp khi còn thiếu bắt buộc hoặc sai định dạng.
    if (missingRequired.length > 0) {
      setFormError(
        `Còn ${missingRequired.length} trường bắt buộc chưa điền: ${missingRequired
          .map((f) => f.label)
          .slice(0, 3)
          .join(', ')}${missingRequired.length > 3 ? '…' : ''}`,
      );
      return;
    }
    if (invalidFields.length > 0) {
      setFormError(
        `Còn ${invalidFields.length} trường sai định dạng: ${invalidFields
          .map((f) => f.label)
          .slice(0, 3)
          .join(', ')}${invalidFields.length > 3 ? '…' : ''}`,
      );
      return;
    }
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

  if (loadError || !formData) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-700 font-bold text-lg mb-2">Chưa tạo được biểu mẫu</p>
          <p className="text-gray-500 text-sm font-medium mb-6">
            {loadError || 'Không có dữ liệu biểu mẫu cho phiên này.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-teal-700 text-white text-sm font-bold rounded hover:bg-teal-800 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => router.push(`/result/${sessionId}`)}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm font-bold rounded hover:bg-gray-50 transition-colors"
            >
              Về kết quả
            </button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-semibold text-gray-500">Bước 4/5: Xác nhận thông tin</p>
            <span className="text-sm text-teal-700 font-bold">80% Hoàn thành</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
            <div className="h-full bg-teal-700 rounded-full" style={{ width: '80%' }} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-teal-700 mb-1 tracking-tight">
              {formData.procedureName || 'Kiểm tra thông tin hồ sơ'}
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              AI đã điền <span className="font-bold text-teal-700">{aiFilledCount}/{unifiedFields.length}</span> trường — rà soát, sửa nếu cần và bổ sung ô còn trống.
            </p>
          </div>
          {/* Chú thích badge */}
          <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
            <span className="flex items-center gap-1.5 text-teal-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              AI điền
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-300" />
              Cần nhập
            </span>
          </div>
        </div>

        {/* Form liền mạch, gom theo nhóm của biểu mẫu */}
        <div className="space-y-3">
          {sections.map((section) => (
            <section
              key={section.title}
              className="bg-white rounded-md p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
            >
              <h2 className="text-sm font-bold text-teal-700 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wide">
                {section.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                {section.fields.map((field) => {
                  const value = formValues[field.key] ?? '';
                  const isEdited = touched[field.key];
                  const aiFilled = (field.filled ?? Boolean(field.value)) && !isEdited;
                  const isEmptyRequired = field.required && !value.trim();
                  const formatError = fieldErrors[field.key];
                  const hasError = isEmptyRequired || Boolean(formatError);
                  const inputClass = `w-full px-3.5 py-2.5 text-sm rounded font-medium text-gray-900 placeholder-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 ${
                    hasError
                      ? 'bg-white border border-red-300'
                      : aiFilled
                        ? 'bg-teal-50/40 border border-teal-200'
                        : 'bg-white border border-gray-300'
                  }`;
                  return (
                    <div key={field.key} className={isWideField(field.key) ? 'sm:col-span-2 lg:col-span-3' : ''}>
                      <label className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {aiFilled ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            AI
                          </span>
                        ) : isEdited ? (
                          <span className="text-[11px] font-bold text-gray-400">Đã sửa</span>
                        ) : null}
                      </label>
                      {isGenderField(field.key) ? (
                        <select
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Chọn giới tính...</option>
                          {GENDER_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : isBooleanField(field.key) ? (
                        <select
                          value={value === 'true' ? 'true' : 'false'}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className={inputClass}
                        >
                          <option value="false">Không</option>
                          <option value="true">Có</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={`Nhập ${field.label.toLowerCase()}...`}
                          className={inputClass}
                        />
                      )}
                      {isEmptyRequired ? (
                        <p className="text-xs font-medium text-red-500 mt-1">Bắt buộc</p>
                      ) : formatError ? (
                        <p className="text-xs font-medium text-red-500 mt-1">{formatError}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {formError && (
          <div className="mt-6 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3.5 text-sm font-medium text-red-700">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button
            className="px-6 py-3.5 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
            onClick={() => router.back()}
          >
            Quay lại
          </button>
          <button
            className="px-6 py-3.5 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all flex-[2] text-center shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? 'Đang lưu...' : 'Tiếp tục xác nhận →'}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <Disclaimer />
          <TrustSignal />
        </div>
      </div>
    </CitizenLayout>
  );
}

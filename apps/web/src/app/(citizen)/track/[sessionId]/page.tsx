'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi } from '@/lib/api-client';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { TrustSignal } from '@/components/ui/TrustSignal';

interface FormField {
  key: string;
  label: string;
  value: string;
  required?: boolean;
}

interface TrackSession {
  status?: string;
  procedureId?: { name?: string; department?: string };
  procedure?: { name?: string };
  createdAt?: string;
  officerNotes?: string;
  aiResult?: {
    smartForm?: { fields?: FormField[]; procedureName?: string };
  };
  govReCheck?: {
    completenessLevel?: 'DAY_DU' | 'CAN_BO_SUNG' | 'CAN_KIEM_TRA_KY';
    riskFlags?: Array<{ type?: string; message?: string; severity?: string }>;
    reviewedAt?: string;
  };
  priority?: { level?: string; reason?: string; slaDeadline?: string };
}

// Trạng thái nào coi là "đã nộp" — chỉ khi đó form mới được lưu & xem read-only.
const SUBMITTED_STATUSES = new Set(['CONFIRMED', 'RECHECKED', 'REJECTED']);

const STATUS_META: Record<string, { label: string; color: string; desc: string }> = {
  INIT: { label: 'Đang soạn thảo', color: 'bg-gray-100 text-gray-700 border-gray-200', desc: 'Hồ sơ chưa nộp — bạn có thể tiếp tục hoàn thiện.' },
  UPLOADING: { label: 'Đang tải lên', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Đang tải giấy tờ lên hệ thống.' },
  AI_PROCESSING: { label: 'AI đang phân tích', color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'AI đang rà soát giấy tờ của bạn.' },
  SCORED: { label: 'Đã phân tích — chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'AI đã phân tích xong. Hồ sơ chưa nộp — vui lòng xác nhận để nộp.' },
  CONFIRMED: { label: 'Đã nộp thành công', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Hồ sơ đã được ghi nhận và đang chờ cán bộ xử lý.' },
  RECHECKED: { label: 'Cán bộ đã tái kiểm', color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Cán bộ đã tái kiểm hồ sơ của bạn.' },
  REJECTED: { label: 'Cần bổ sung / bị từ chối', color: 'bg-red-100 text-red-700 border-red-200', desc: 'Hồ sơ cần bổ sung hoặc chưa đạt. Xem ghi chú của cán bộ bên dưới.' },
};

const COMPLETENESS_META: Record<string, { label: string; color: string }> = {
  DAY_DU: { label: 'Hồ sơ đầy đủ', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  CAN_BO_SUNG: { label: 'Cần bổ sung', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  CAN_KIEM_TRA_KY: { label: 'Cần kiểm tra kỹ', color: 'text-red-700 bg-red-50 border-red-200' },
};

// Prefix key → tiêu đề nhóm (đồng bộ với trang smartform).
const SECTION_TITLES: Record<string, string> = {
  nguoiYeuCau: 'Người yêu cầu', treEm: 'Thông tin trẻ em', phuHuynh2: 'Phụ huynh còn lại',
  ketHon: 'Giấy chứng nhận kết hôn', hoKinhDoanh: 'Hộ kinh doanh', chuHoCu: 'Chủ hộ trước khi thay đổi',
  chuHoMoi: 'Chủ hộ sau khi thay đổi', thayDoi: 'Nội dung thay đổi',
  benNhan: 'Bên nhận chuyển nhượng', thuaDat: 'Thông tin thửa đất', benChuyen: 'Bên chuyển nhượng',
  hopDong: 'Thông tin giao dịch', congTrinh: 'Nhà ở, công trình xây dựng',
};

function groupIntoSections(fields: FormField[]) {
  const order: string[] = [];
  const byTitle = new Map<string, FormField[]>();
  for (const f of fields) {
    const prefix = f.key.includes('.') ? f.key.split('.')[0] : '';
    const title = SECTION_TITLES[prefix] ?? 'Thông tin chung';
    if (!byTitle.has(title)) { byTitle.set(title, []); order.push(title); }
    byTitle.get(title)!.push(f);
  }
  return order.map((title) => ({ title, fields: byTitle.get(title)! }));
}

export default function TrackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<TrackSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    sessionsApi
      .get(sessionId)
      .then((s) => { if (!cancelled) { setSession(s as unknown as TrackSession); setIsLoading(false); } })
      .catch(() => { if (!cancelled) { setLoadError('Không tải được hồ sơ. Vui lòng thử lại.'); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, [sessionId]);

  const status = session?.status ?? 'INIT';
  const isSubmitted = SUBMITTED_STATUSES.has(status);
  const statusMeta = STATUS_META[status] ?? STATUS_META.INIT;

  const fields = useMemo<FormField[]>(() => session?.aiResult?.smartForm?.fields ?? [], [session]);
  const sections = useMemo(() => groupIntoSections(fields), [fields]);
  const procedureName =
    session?.aiResult?.smartForm?.procedureName || session?.procedureId?.name || session?.procedure?.name || 'Hồ sơ thủ tục';

  // Nơi tiếp tục hoàn thiện hồ sơ nháp theo trạng thái hiện tại.
  const continueHref = status === 'SCORED' ? `/confirm/${sessionId}` : status === 'AI_PROCESSING' || status === 'UPLOADING' ? `/result/${sessionId}` : `/upload/${sessionId}`;

  if (isLoading) {
    return (
      <CitizenLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <LoadingSkeleton variant="card" className="rounded-md" />
          <LoadingSkeleton variant="card" className="mt-6 rounded-md" />
        </div>
      </CitizenLayout>
    );
  }

  if (loadError || !session) {
    return (
      <CitizenLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-700 font-bold text-lg mb-2">Không tải được hồ sơ</p>
          <p className="text-gray-500 text-sm font-medium mb-6">{loadError || 'Hồ sơ không tồn tại hoặc đã hết hạn.'}</p>
          <button onClick={() => router.push('/history')} className="px-6 py-2.5 bg-teal-700 text-white text-sm font-bold rounded hover:bg-teal-800 transition-colors">
            Về lịch sử hồ sơ
          </button>
        </div>
      </CitizenLayout>
    );
  }

  const completeness = session.govReCheck?.completenessLevel;
  const completenessMeta = completeness ? COMPLETENESS_META[completeness] : undefined;
  const riskFlags = session.govReCheck?.riskFlags ?? [];

  return (
    <CitizenLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
        {/* Header + trạng thái */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-teal-700 mb-1 tracking-tight">{procedureName}</h1>
            <p className="text-gray-500 text-sm font-medium">
              Mã HS: <span className="font-semibold text-gray-700">{sessionId.substring(0, 8).toUpperCase()}</span>
              {session.createdAt && <> • {new Date(session.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</>}
            </p>
          </div>
          <span className={`shrink-0 px-3 py-1.5 rounded-full border text-sm font-bold h-max ${statusMeta.color}`}>{statusMeta.label}</span>
        </div>

        <div className="bg-white rounded-md p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-4">
          <p className="text-sm font-medium text-gray-600">{statusMeta.desc}</p>
        </div>

        {/* CHƯA NỘP → chỉ trạng thái + nút tiếp tục (không có form đã lưu) */}
        {!isSubmitted ? (
          <div className="bg-white rounded-md p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] text-center">
            <p className="text-gray-600 font-medium mb-1">Hồ sơ này chưa được nộp nên chưa có tờ khai lưu lại.</p>
            <p className="text-gray-400 text-sm mb-6">Hoàn thiện và xác nhận để nộp hồ sơ.</p>
            <button
              onClick={() => router.push(continueHref)}
              className="px-6 py-3 rounded font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all shadow-md"
            >
              Tiếp tục hoàn thiện →
            </button>
          </div>
        ) : (
          <>
            {/* Trạng thái xử lý của cán bộ */}
            <section className="bg-white rounded-md p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] mb-4">
              <h2 className="text-sm font-bold text-teal-700 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wide">Trạng thái xử lý của cán bộ</h2>
              {completenessMeta || riskFlags.length > 0 || session.officerNotes || session.govReCheck?.reviewedAt ? (
                <div className="space-y-3">
                  {completenessMeta && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Đánh giá:</span>
                      <span className={`px-2.5 py-1 rounded border text-xs font-bold ${completenessMeta.color}`}>{completenessMeta.label}</span>
                    </div>
                  )}
                  {riskFlags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1.5">Lưu ý từ hệ thống:</p>
                      <ul className="space-y-1.5">
                        {riskFlags.map((f, i) => (
                          <li key={i} className="text-sm text-amber-800 bg-amber-50/60 border border-amber-100 rounded px-3 py-2">
                            {f.message || f.type}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.officerNotes && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Ghi chú của cán bộ:</p>
                      <p className="text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded px-3 py-2 leading-relaxed">{session.officerNotes}</p>
                    </div>
                  )}
                  {session.govReCheck?.reviewedAt && (
                    <p className="text-xs text-gray-400">Cán bộ xử lý lúc {new Date(session.govReCheck.reviewedAt).toLocaleString('vi-VN')}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-500">Hồ sơ đã nộp và đang chờ cán bộ tiếp nhận xử lý. Chưa có cập nhật mới.</p>
              )}
            </section>

            {/* Form đã điền — CHỈ ĐỌC */}
            <section className="bg-white rounded-md p-4 sm:p-5 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <h2 className="text-sm font-bold text-teal-700 uppercase tracking-wide">Tờ khai đã nộp (chỉ xem)</h2>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm font-medium text-gray-500">Không có dữ liệu tờ khai cho hồ sơ này.</p>
              ) : (
                <div className="space-y-5">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{section.title}</h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        {section.fields.map((f) => (
                          <div key={f.key} className="flex flex-col border-b border-gray-50 pb-2">
                            <dt className="text-[13px] font-medium text-gray-500">{f.label}</dt>
                            <dd className={`text-sm font-semibold ${f.value ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                              {f.value || '(để trống)'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button
            onClick={() => router.push('/history')}
            className="px-6 py-3 rounded font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-1 text-center"
          >
            ← Về lịch sử hồ sơ
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

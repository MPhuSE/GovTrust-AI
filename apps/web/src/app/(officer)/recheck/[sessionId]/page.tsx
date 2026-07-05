'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sessionsApi, recheckApi } from '@/lib/api-client';
import { OfficerLayout } from '@/components/layout/OfficerLayout';
import { ScoreCircle } from '@/components/ui/ScoreCircle';
import { LawCitation } from '@/components/ui/LawCitation';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle2, AlertTriangle, Search, Flag, Lightbulb, FileText } from 'lucide-react';

interface SmartFormField {
  key: string;
  label: string;
  value: string;
  required?: boolean;
}

// Prefix key → tiêu đề nhóm (đồng bộ với trang track/smartform của công dân).
const SECTION_TITLES: Record<string, string> = {
  nguoiYeuCau: 'Người yêu cầu', treEm: 'Thông tin trẻ em', phuHuynh2: 'Phụ huynh còn lại',
  ketHon: 'Giấy chứng nhận kết hôn', hoKinhDoanh: 'Hộ kinh doanh', chuHoCu: 'Chủ hộ trước khi thay đổi',
  chuHoMoi: 'Chủ hộ sau khi thay đổi', thayDoi: 'Nội dung thay đổi',
  benNhan: 'Bên nhận chuyển nhượng', thuaDat: 'Thông tin thửa đất', benChuyen: 'Bên chuyển nhượng',
  hopDong: 'Thông tin giao dịch', congTrinh: 'Nhà ở, công trình xây dựng',
};

// Chuẩn hoá giá trị field: bool "Có/Không", bỏ giá trị rỗng/false để không hiển thị rác.
function normalizeFieldValue(raw: unknown): string | null {
  if (raw === true || raw === 'true') return 'Có';
  if (raw === false || raw === 'false') return null; // ẩn cờ tắt (VD: không đăng ký công trình)
  const v = (raw ?? '').toString().trim();
  if (!v) return null; // ẩn field để trống với officer (chỉ xem thông tin thực có)
  return v;
}

function groupFormSections(fields: SmartFormField[]) {
  const order: string[] = [];
  const byTitle = new Map<string, Array<{ key: string; label: string; value: string }>>();
  for (const f of fields) {
    const value = normalizeFieldValue(f.value);
    if (value === null) continue; // bỏ field rỗng/false
    const prefix = f.key.includes('.') ? f.key.split('.')[0] : '';
    const title = SECTION_TITLES[prefix] ?? 'Thông tin chung';
    if (!byTitle.has(title)) { byTitle.set(title, []); order.push(title); }
    byTitle.get(title)!.push({ key: f.key, label: f.label, value });
  }
  // Bỏ luôn section rỗng sau khi lọc.
  return order.map((title) => ({ title, fields: byTitle.get(title)! })).filter((s) => s.fields.length > 0);
}

interface RecheckSession {
  _id: string;
  procedureName: string;
  score: number;
  grade: string;
  breakdown: Array<{ ruleId: string; detail: string; impact: number; severity: string }>;
  crossCheckResults: Array<{
    ruleName?: string;
    field: string;
    left?: string;
    right?: string;
    leftValue?: string | null;
    rightValue?: string | null;
    status: string;
    message?: string;
    legalBasis?: { article: string; note?: string };
  }>;
  lawGuardAlerts: Array<{
    type: string;
    message: string;
    confidence: number;
    legalSource?: { title: string; article: string; url?: string };
  }>;
  riskFlags: Array<{ type: string; message: string; severity: string }>;
  formFields: SmartFormField[];
}

export default function RecheckPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<RecheckSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decision, setDecision] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    sessionsApi
      .get(sessionId)
      .then((data: unknown) => {
        const s = data as any;

        setSession({
          _id: sessionId,
          procedureName: s.procedure?.name || s.procedureId?.name || 'Không rõ thủ tục',
          score: s.aiResult?.score?.score || 0,
          grade: s.aiResult?.score?.grade || 'D',
          breakdown: (s.aiResult?.score?.breakdown || []) as RecheckSession['breakdown'],
          crossCheckResults: (s.aiResult?.crossCheck?.checks || []) as RecheckSession['crossCheckResults'],
          lawGuardAlerts: (s.aiResult?.lawGuardAlerts || []) as RecheckSession['lawGuardAlerts'],
          riskFlags: (s.govReCheck?.riskFlags || []) as RecheckSession['riskFlags'],
          formFields: (s.aiResult?.smartForm?.fields || []) as SmartFormField[],
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!decision) return;
    setIsSubmitting(true);
    try {
      await recheckApi.recheck(sessionId, { decision, note });
      setSubmitted(true);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (isLoading) {
    return (
      <OfficerLayout>
        <div className="p-8 max-w-5xl mx-auto">
          <LoadingSkeleton variant="score" className="rounded-md" />
          <LoadingSkeleton variant="card" className="mt-6 rounded-md" />
        </div>
      </OfficerLayout>
    );
  }

  if (submitted) {
    return (
      <OfficerLayout>
        <div className="p-8 max-w-2xl mx-auto text-center flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-teal-100">
            <CheckCircle2 className="w-12 h-12 text-teal-600" />
          </motion.div>
          <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl font-extrabold text-navy mb-4">Tái kiểm hoàn tất</motion.h1>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-navy/60 font-medium mb-8 max-w-md mx-auto">
            Kết quả tái kiểm và quyết định của cán bộ đã được ghi nhận vào hệ thống thành công.
          </motion.p>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button onClick={() => router.push('/queue')} size="lg" className="w-full sm:w-auto">
              <ChevronLeft className="w-5 h-5 mr-2" /> Quay lại danh sách
            </Button>
          </motion.div>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      <div className="p-6 sm:p-10 max-w-7xl mx-auto bg-ivory/20 min-h-screen">
        <motion.div initial="hidden" animate="show" variants={containerVariants}>
          
          <motion.button 
            variants={itemVariants}
            onClick={() => router.push('/queue')} 
            className="text-sm font-semibold text-navy/50 hover:text-navy mb-6 flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách
          </motion.button>

          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-extrabold text-navy mb-3 tracking-tight">
              Tái kiểm hồ sơ <span className="text-teal-600">AI</span>
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono bg-white shadow-sm px-3 py-1 text-sm">#{sessionId.slice(-6).toUpperCase()}</Badge>
              <span className="text-navy/70 font-medium text-lg">{session?.procedureName}</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: AI Results */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
              
              {/* Score Card */}
              <Card className="border-navy/10 shadow-sm bg-white">
                <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">
                  <ScoreCircle
                    score={session?.score || 0}
                    grade={(session?.grade || 'D') as 'A' | 'B' | 'C' | 'D'}
                    size={140}
                  />
                  <div className="flex-1 w-full">
                    <h3 className="font-bold text-navy text-lg mb-4">Kết quả AI đánh giá</h3>
                    <div className="space-y-1 bg-navy/5 p-4 rounded border border-navy/10">
                      {session?.breakdown.map((b, i) => {
                        // impact có thể là 'delta' (shape cũ) hoặc thiếu → tránh NaN.
                        const raw = (b.impact ?? (b as { delta?: number }).delta ?? 0);
                        const impact = Number(raw) || 0;
                        return (
                          <div key={b.ruleId || i} className="flex items-center justify-between text-sm py-2 border-b border-navy/5 last:border-0 gap-4">
                            <span className="text-navy/80 font-medium">{b.detail || (b as { label?: string }).label || 'Điểm trừ'}</span>
                            {impact !== 0 && (
                              <Badge variant="destructive" animate={false} className="shrink-0 font-mono">-{Math.abs(impact)}đ</Badge>
                            )}
                          </div>
                        );
                      })}
                      {(!session?.breakdown || session.breakdown.length === 0) && (
                        <p className="text-sm text-teal-700 font-medium text-center py-2">Không có điểm trừ nào. Hồ sơ hoàn hảo.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tờ khai công dân đã điền (biểu mẫu nộp lên) */}
              <Card className="border-navy/10 shadow-sm bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-navy">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-teal-600" />
                    </div>
                    Tờ khai công dân đã nộp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const sections = session?.formFields ? groupFormSections(session.formFields) : [];
                    if (sections.length === 0) {
                      return <p className="text-sm font-medium text-navy/50">Hồ sơ này không có dữ liệu tờ khai.</p>;
                    }
                    return (
                      <div className="space-y-5">
                        {sections.map((sec) => (
                          <div key={sec.title}>
                            <h4 className="text-xs font-bold text-navy/40 uppercase tracking-wider mb-2">{sec.title}</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                              {sec.fields.map((f) => (
                                <div key={f.key} className="flex flex-col border-b border-navy/5 pb-2">
                                  <dt className="text-[13px] font-medium text-navy/50">{f.label}</dt>
                                  <dd className="text-sm font-semibold text-navy">{f.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* CrossCheck Card */}
              {session?.crossCheckResults && session.crossCheckResults.length > 0 && (
                <Card className="border-navy/10 shadow-sm bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-navy">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Search className="w-4 h-4 text-blue-600" />
                      </div>
                      Đối chiếu chéo tự động
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {session.crossCheckResults.map((r, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 text-sm p-4 rounded border ${
                            r.status === 'MATCH'
                              ? 'bg-teal-50/50 border-teal-100 text-teal-900'
                              : r.status === 'MISMATCH'
                              ? 'bg-red-50/50 border-red-100 text-red-900'
                              : 'bg-amber-50/50 border-amber-100 text-amber-900'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0">
                            {r.status === 'MATCH' ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : r.status === 'MISMATCH' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold leading-relaxed">{r.ruleName || r.field}</p>
                            {r.message && <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{r.message}</p>}
                            {r.status === 'MISMATCH' && r.legalBasis && (
                              <p className="text-xs mt-1.5 flex items-start gap-1">
                                <span className="leading-none">⚖️</span>
                                <span><span className="font-bold">Căn cứ:</span> {r.legalBasis.article}{r.legalBasis.note ? ` — ${r.legalBasis.note}` : ''}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Flags Card */}
              {session?.riskFlags && session.riskFlags.length > 0 && (
                <Card className="border-red-200 shadow-sm bg-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <Flag className="w-4 h-4 text-red-600" />
                      </div>
                      Cảnh báo rủi ro (Nghiệp vụ)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 pl-2">
                      {session.riskFlags.map((flag, i) => (
                        <li key={i} className="text-sm font-semibold text-navy flex items-start gap-3">
                          <span className={`mt-1 ${flag.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>•</span>
                          <span className="leading-relaxed">
                            {flag.message}
                            <Badge
                              variant="outline"
                              animate={false}
                              className={`ml-2 align-middle text-[10px] font-mono ${flag.severity === 'HIGH' ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'}`}
                            >
                              {flag.severity}
                            </Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* LawGuard Card */}
              {session?.lawGuardAlerts && session.lawGuardAlerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-navy text-lg px-2">Căn cứ pháp lý áp dụng</h3>
                  {session.lawGuardAlerts.map((alert, i) =>
                    alert.legalSource ? (
                      <LawCitation key={i} source={alert.legalSource} confidence={alert.confidence} content={alert.message} />
                    ) : null,
                  )}
                </div>
              )}
            </motion.div>

            {/* Right: Decision */}
            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="border-navy/10 shadow-sm bg-white sticky top-24">
                <CardHeader className="border-b border-navy/5 pb-4 mb-4">
                  <CardTitle className="text-lg text-navy">Quyết định của cán bộ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {[
                      { value: 'PASS', label: 'Đủ điều kiện, xử lý ngay', icon: <CheckCircle2 className="w-5 h-5 text-teal-600" /> },
                      { value: 'NEED_MORE', label: 'Yêu cầu bổ sung', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
                      { value: 'NEED_REVIEW', label: 'Cần tái kiểm tra chéo', icon: <Search className="w-5 h-5 text-blue-500" /> },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        onClick={() => setDecision(opt.value)}
                        className={`flex items-center gap-4 p-4 rounded border cursor-pointer transition-all duration-200 ${
                          decision === opt.value
                            ? 'border-teal-500 bg-teal-50/30 shadow-sm'
                            : 'border-navy/10 hover:border-navy/30 hover:bg-navy/5'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${decision === opt.value ? 'border-teal-600' : 'border-navy/30'}`}>
                          {decision === opt.value && <motion.div layoutId="decision-dot" className="w-2.5 h-2.5 bg-teal-600 rounded-full"></motion.div>}
                        </div>
                        <span className="shrink-0">{opt.icon}</span>
                        <span className={`font-bold text-sm ${decision === opt.value ? 'text-navy' : 'text-navy/70'}`}>{opt.label}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-navy mb-2">Ghi chú nghiệp vụ</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-ivory/50 border border-navy/10 rounded focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none text-navy font-medium resize-none placeholder-navy/30"
                      rows={4}
                      placeholder="Nhập ghi chú hoặc lý do (nếu cần bổ sung/tái kiểm)..."
                    />
                  </div>

                  <Button
                    className="w-full py-6 text-base shadow-md"
                    disabled={!decision || isSubmitting}
                    onClick={handleSubmit}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin text-white mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận quyết định'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="bg-teal-50/50 rounded p-4 border border-teal-100 flex gap-3 shadow-sm">
                <Lightbulb className="w-5 h-5 text-teal-600 shrink-0" />
                <p className="text-xs font-medium text-teal-900 leading-relaxed">
                  <strong>Ghi chú:</strong> Kết quả từ AI mang tính chất hỗ trợ và phân loại tự động. Quyết định phê duyệt cuối cùng phụ thuộc hoàn toàn vào Cán bộ nghiệp vụ.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </OfficerLayout>
  );
}

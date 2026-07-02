'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { documentsApi, scoringApi, sessionsApi, smartformApi } from '@/lib/api-client';
import { getReusedChecklistIds } from '@/lib/identity-evidence';
import { ChecklistUploadOption, UploadZone } from '@/components/upload/UploadZone';
import { Progress } from '@/components/ui/Progress';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { PIPELINE_STEPS } from '@/lib/constants';

interface ProcedureInSession {
  code: string;
  name: string;
  checklist: Array<ChecklistUploadOption & { roleInProcedure?: string }>;
}

interface SessionResponse {
  procedureId: ProcedureInSession;
  documents?: Array<{ checklistId: string; docTypeId: string }>;
  pipeline?: { steps?: Record<string, string> };
  aiResult?: {
    ocrData?: Record<string, { documentTypeCode?: string; source?: string }>;
  };
}

interface UploadedDocument {
  checklistId: string;
  documentTypeCode: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function UploadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [procedure, setProcedure] = useState<ProcedureInSession | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [reusedChecklistIds, setReusedChecklistIds] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let active = true;
    sessionsApi.get<SessionResponse>(sessionId)
      .then(session => {
        if (!active) return;
        setProcedure(session.procedureId);
        setReusedChecklistIds(getReusedChecklistIds(session));
        setUploadedDocs((session.documents ?? [])
          .filter(document => Boolean(document.checklistId))
          .map(document => ({
            checklistId: document.checklistId,
            documentTypeCode: document.docTypeId,
          })));
      })
      .catch(error => setStatusMsg(`Lỗi: ${(error as Error).message}`))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [sessionId]);

  const completedIds = useMemo(
    () => new Set([...reusedChecklistIds, ...uploadedDocs.map(doc => doc.checklistId)]),
    [reusedChecklistIds, uploadedDocs],
  );
  const missingRequired = useMemo(
    () => (procedure?.checklist ?? []).filter(item =>
      item.isRequired && item.inputMode !== 'REFERENCE' && !completedIds.has(item.id),
    ),
    [procedure, completedIds],
  );

  const handleUpload = async (file: File, documentTypeCode: string, checklistId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('documentTypeCode', documentTypeCode);
    formData.append('checklistId', checklistId);
    await documentsApi.upload(formData);
    setUploadedDocs(prev => [
      ...prev.filter(doc => doc.checklistId !== checklistId),
      { checklistId, documentTypeCode },
    ]);
  };

  const waitForOcr = async (checklistIds: string[]) => {
    if (checklistIds.length === 0) return;
    for (let attempt = 0; attempt < 90; attempt++) {
      const session = await sessionsApi.get<SessionResponse>(sessionId);
      const ocrData = session.aiResult?.ocrData ?? {};
      if (checklistIds.every(id => Boolean(ocrData[id]))) return;
      await wait(1000);
    }
    throw new Error('OCR xử lý quá lâu. Vui lòng thử lại sau.');
  };

  const waitForLawGuard = async () => {
    for (let attempt = 0; attempt < 90; attempt++) {
      const session = await sessionsApi.get<SessionResponse>(sessionId);
      const status = session.pipeline?.steps?.lawguard;
      if (status === 'done') return;
      if (status === 'failed') throw new Error('LawGuard xử lý thất bại. Vui lòng thử lại.');
      await wait(1000);
    }
    throw new Error('LawGuard xử lý quá lâu. Vui lòng thử lại sau.');
  };

  const handleRunPipeline = async () => {
    if (missingRequired.length > 0) return;
    setIsProcessing(true);
    try {
      setStatusMsg('Đang gửi giấy tờ sang VNPT OCR...');
      setCurrentStepIndex(2);
      for (const doc of uploadedDocs) {
        await documentsApi.triggerOcr(sessionId, doc.documentTypeCode, doc.checklistId);
      }

      setStatusMsg('Đang chờ OCR đọc xong các giấy tờ...');
      await waitForOcr(uploadedDocs.map(doc => doc.checklistId));

      setStatusMsg('Đang kiểm tra chéo thông tin...');
      setCurrentStepIndex(3);
      await scoringApi.crosscheck(sessionId);

      setStatusMsg('Đang chấm điểm hồ sơ...');
      setCurrentStepIndex(4);
      const scoreResult = await scoringApi.score<{ canSubmit: boolean }>(sessionId);

      setStatusMsg('Đang tra cứu căn cứ pháp lý...');
      setCurrentStepIndex(5);
      await scoringApi.lawguard(sessionId);
      await waitForLawGuard();

      if (scoreResult.canSubmit) {
        setStatusMsg('Hồ sơ hợp lý — đang tạo tờ khai tự điền...');
        setCurrentStepIndex(6);
        await smartformApi.generate(sessionId);
      } else {
        setStatusMsg('Hồ sơ còn lỗi cần sửa trước khi tạo tờ khai.');
      }

      router.push(`/result/${sessionId}`);
    } catch (error) {
      setStatusMsg(`Lỗi: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500">Đang tải checklist...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Progress steps={PIPELINE_STEPS.map(step => step.label)} currentIndex={currentStepIndex} />

      <div className="card mt-6">
        <h1 className="text-xl font-semibold text-blue-800">{procedure?.name}</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">Tải từng giấy tờ vào đúng vị trí của thủ tục.</p>

        <div className="space-y-2 mb-5">
          {(procedure?.checklist ?? []).map(item => {
            const complete = completedIds.has(item.id) || item.inputMode === 'REFERENCE';
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span className={complete ? 'text-green-600' : item.isRequired ? 'text-red-500' : 'text-gray-400'}>
                  {complete ? '✓' : item.isRequired ? '●' : '○'}
                </span>
                <div>
                  <div className="font-medium text-gray-800">
                    {item.label}{!item.isRequired && ' (nếu có)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.inputMode === 'EKYC' && complete
                      ? 'Đã xác minh từ tài khoản — không cần tải lại'
                      : item.inputMode === 'REFERENCE'
                        ? 'Hệ thống tự đối chiếu dữ liệu tham chiếu'
                        : item.roleInProcedure}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {procedure && (
          <UploadZone
            onUpload={handleUpload}
            documentTypes={procedure.checklist}
            reusedChecklistIds={reusedChecklistIds}
          />
        )}
      </div>

      {statusMsg && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
          {statusMsg}
        </div>
      )}

      {missingRequired.length > 0 && (
        <p className="mt-4 text-sm text-amber-700">
          Còn thiếu: {missingRequired.map(item => item.label).join(', ')}.
        </p>
      )}

      <button
        className="btn-primary w-full mt-6 py-3 text-base"
        onClick={handleRunPipeline}
        disabled={isProcessing || missingRequired.length > 0}
      >
        {isProcessing ? 'Đang phân tích...' : 'Kiểm tra và tự điền tờ khai'}
      </button>

      <div className="mt-4"><Disclaimer /></div>
    </main>
  );
}

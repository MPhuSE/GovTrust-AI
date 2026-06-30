'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { documentsApi, scoringApi, smartformApi } from '@/lib/api-client';
import { UploadZone } from '@/components/upload/UploadZone';
import { Progress } from '@/components/ui/Progress';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { PIPELINE_STEPS } from '@/lib/constants';

export default function UploadPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpload = async (file: File, documentTypeCode: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    formData.append('documentTypeCode', documentTypeCode);
    await documentsApi.upload(formData);
    setUploadedDocs(prev => [...prev, documentTypeCode]);
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    try {
      setStatusMsg('Đang gọi VNPT OCR...');
      setCurrentStepIndex(2);
      for (const docType of uploadedDocs) {
        await documentsApi.triggerOcr(sessionId, docType);
      }

      setStatusMsg('Đang kiểm tra chéo thông tin...');
      setCurrentStepIndex(3);
      await scoringApi.crosscheck(sessionId);

      setStatusMsg('Đang chấm điểm hồ sơ...');
      setCurrentStepIndex(4);
      await scoringApi.score(sessionId);

      setStatusMsg('Đang tra cứu căn cứ pháp lý...');
      setCurrentStepIndex(5);
      await scoringApi.lawguard(sessionId);

      setStatusMsg('Đang tự điền form...');
      setCurrentStepIndex(6);
      await smartformApi.generate(sessionId);

      router.push(`/result/${sessionId}`);
    } catch (e) {
      setStatusMsg(`Lỗi: ${(e as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Progress steps={PIPELINE_STEPS.map(s => s.label)} currentIndex={currentStepIndex} />

      <div className="card mt-6">
        <h2 className="mb-4">Upload giấy tờ</h2>
        <UploadZone onUpload={handleUpload} />
        {uploadedDocs.length > 0 && (
          <div className="mt-4 text-sm text-green-700">
            Đã upload: {uploadedDocs.join(', ')}
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm">
          {statusMsg}
        </div>
      )}

      <button
        className="btn-primary w-full mt-6 py-3 text-base"
        onClick={handleRunPipeline}
        disabled={isProcessing || uploadedDocs.length === 0}
      >
        {isProcessing ? 'Đang phân tích...' : 'Phân tích hồ sơ'}
      </button>

      <div className="mt-4">
        <Disclaimer />
      </div>
    </main>
  );
}

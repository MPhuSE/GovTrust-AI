'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants';
import { CameraCapture } from './CameraCapture';

export interface ChecklistUploadOption {
  id: string;
  documentTypeCode: string;
  label: string;
  isRequired: boolean;
  conditionalOn?: string;
  inputMode?: 'UPLOAD' | 'EKYC' | 'REFERENCE';
}

interface UploadZoneProps {
  onUpload: (file: File, documentTypeCode: string, checklistId: string) => Promise<void>;
  documentTypes: ChecklistUploadOption[];
  reusedChecklistIds?: string[];
}

type Mode = 'file' | 'camera';

export function UploadZone({
  onUpload,
  documentTypes,
  reusedChecklistIds = [],
}: UploadZoneProps) {
  const availableOptions = useMemo(
    () => documentTypes.filter(option =>
      option.inputMode !== 'REFERENCE' && !reusedChecklistIds.includes(option.id),
    ),
    [documentTypes, reusedChecklistIds],
  );
  const [selectedChecklistId, setSelectedChecklistId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode>('file');

  useEffect(() => {
    if (!availableOptions.some(option => option.id === selectedChecklistId)) {
      setSelectedChecklistId(availableOptions[0]?.id ?? '');
    }
  }, [availableOptions, selectedChecklistId]);

  const selectedOption = availableOptions.find(option => option.id === selectedChecklistId);

  const submitFile = useCallback(
    async (file: File) => {
      if (!selectedOption) return;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File quá lớn. Tối đa ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
      setIsUploading(true);
      try {
        await onUpload(file, selectedOption.documentTypeCode, selectedOption.id);
        setUploadedFiles(prev => ({ ...prev, [selectedOption.id]: file.name }));
      } finally {
        setIsUploading(false);
      }
    },
    [selectedOption, onUpload],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) await submitFile(file);
    },
    [submitFile],
  );

  const handleCapture = useCallback(
    async (file: File) => {
      setMode('file');
      await submitFile(file);
    },
    [submitFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_FILE_TYPES.map(type => [type, []])),
    maxFiles: 1,
    disabled: !selectedOption,
  });

  if (availableOptions.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        ✓ Không còn giấy tờ nào cần tải lên.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Giấy tờ cần tải</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedChecklistId}
          onChange={event => setSelectedChecklistId(event.target.value)}
        >
          {availableOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.label}{option.isRequired ? ' *' : ' (nếu có)'}
            </option>
          ))}
        </select>
        {selectedOption?.conditionalOn && (
          <p className="text-xs text-amber-700 mt-1">Điều kiện: {selectedOption.conditionalOn}</p>
        )}
      </div>

      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          className={`flex-1 py-2 font-medium transition-colors ${
            mode === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setMode('file')}
        >
          Tải file lên
        </button>
        <button
          type="button"
          className={`flex-1 py-2 font-medium transition-colors ${
            mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setMode('camera')}
        >
          Chụp ảnh
        </button>
      </div>

      {mode === 'file' ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-4xl mb-3">📁</div>
          <p className="text-gray-600 font-medium">
            {isDragActive ? 'Thả file vào đây' : 'Bấm để chọn file hoặc kéo thả'}
          </p>
          <p className="text-gray-400 text-sm mt-1">JPG, PNG, PDF — tối đa {MAX_FILE_SIZE_MB}MB</p>
          {isUploading && <p className="text-blue-600 text-sm mt-2">Đang upload...</p>}
        </div>
      ) : selectedOption ? (
        <CameraCapture
          documentType={selectedOption.documentTypeCode}
          onCapture={handleCapture}
          onClose={() => setMode('file')}
        />
      ) : null}

      {Object.keys(uploadedFiles).length > 0 && (
        <ul className="space-y-1">
          {Object.entries(uploadedFiles).map(([checklistId, fileName]) => {
            const option = documentTypes.find(item => item.id === checklistId);
            return (
              <li key={checklistId} className="text-sm text-green-700 flex items-center gap-2">
                <span>✓</span> {option?.label}: {fileName}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

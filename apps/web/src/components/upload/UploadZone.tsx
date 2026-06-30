'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants';

interface UploadZoneProps {
  onUpload: (file: File, documentTypeCode?: string) => Promise<void>;
  label?: string;
}

export function UploadZone({ onUpload, label }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`File quá lớn. Tối đa ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setErrorMsg(null);
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (e) {
        setErrorMsg((e as Error).message || 'Lỗi upload, vui lòng thử lại');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_FILE_TYPES.map((t) => [t, []])),
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        role="button"
        aria-label={label || 'Tải tệp lên'}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-6">
          {/* Upload */}
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-medium text-gray-600">
              {isDragActive ? 'Thả file vào đây' : 'Tải tệp lên'}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">
              PDF, JPG, PNG (Tối đa {MAX_FILE_SIZE_MB}MB)
            </span>
          </div>

          <div className="w-px h-12 bg-gray-200" />

          {/* Camera */}
          <div className="flex flex-col items-center">
            <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">Chụp ảnh ngay</span>
            <span className="text-xs text-gray-400 mt-0.5">Sử dụng camera thiết bị</span>
          </div>
        </div>

        {isUploading && (
          <div className="mt-3 flex items-center justify-center gap-2 text-blue-600 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang tải lên...
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="input-error-msg mt-2 flex items-center gap-1">
          <span>❌</span> {errorMsg}
        </p>
      )}
    </div>
  );
}

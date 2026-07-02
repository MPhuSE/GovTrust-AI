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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 bg-[#FBFBFA]'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        role="button"
        aria-label={label || 'Tải tệp lên'}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Upload */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-colors ${isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#0A192F]">
              {isDragActive ? 'Thả file vào đây' : 'Tải tệp lên'}
            </span>
            <span className="text-xs font-medium text-gray-500 mt-1">
              PDF, JPG, PNG (Tối đa {MAX_FILE_SIZE_MB}MB)
            </span>
          </div>

          <div className="hidden sm:block w-px h-20 bg-gray-200" />
          <div className="sm:hidden h-px w-20 bg-gray-200" />

          {/* Camera */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center transition-colors ${isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#0A192F]">Chụp ảnh ngay</span>
            <span className="text-xs font-medium text-gray-500 mt-1">Sử dụng camera thiết bị</span>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-sm font-bold">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang tải lên...
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 p-3 rounded-lg border border-red-100">
          <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">❌</span> {errorMsg}
        </p>
      )}
    </div>
  );
}

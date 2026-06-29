'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_MB } from '@/lib/constants';

interface UploadZoneProps {
  onUpload: (file: File, documentTypeCode: string) => Promise<void>;
}

const DOC_TYPES = [
  { code: 'CCCD', label: 'CCCD / CMND' },
  { code: 'GIAY_KHAI_SINH', label: 'Giấy khai sinh' },
  { code: 'GIAY_CHUNG_SINH', label: 'Giấy chứng sinh' },
  { code: 'HO_KHAU', label: 'Sổ hộ khẩu' },
  { code: 'GIAY_DANG_KY_KET_HON', label: 'Giấy đăng ký kết hôn' },
];

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [selectedType, setSelectedType] = useState(DOC_TYPES[0].code);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File quá lớn. Tối đa ${MAX_FILE_SIZE_MB}MB`);
        return;
      }

      setIsUploading(true);
      try {
        await onUpload(file, selectedType);
        setUploadedFiles(prev => [...prev, `${DOC_TYPES.find(d => d.code === selectedType)?.label} — ${file.name}`]);
      } finally {
        setIsUploading(false);
      }
    },
    [selectedType, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_FILE_TYPES.map(t => [t, []])),
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loại giấy tờ</label>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          {DOC_TYPES.map(d => (
            <option key={d.code} value={d.code}>{d.label}</option>
          ))}
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📷</div>
        <p className="text-gray-600 font-medium">
          {isDragActive ? 'Thả file vào đây' : 'Chụp ảnh hoặc kéo thả file'}
        </p>
        <p className="text-gray-400 text-sm mt-1">JPG, PNG, PDF — tối đa {MAX_FILE_SIZE_MB}MB</p>
        {isUploading && <p className="text-blue-600 text-sm mt-2">Đang upload...</p>}
      </div>

      {uploadedFiles.length > 0 && (
        <ul className="space-y-1">
          {uploadedFiles.map((f, i) => (
            <li key={i} className="text-sm text-green-700 flex items-center gap-2">
              <span>✓</span> {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

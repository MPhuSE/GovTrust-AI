'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { proceduresApi, sessionsApi } from '@/lib/api-client';

interface Procedure {
  _id: string;
  code: string;
  name: string;
  description?: string;
  department?: string;
  priorityConfig?: { slaDays: number };
}

export default function ServicesPage() {
  const router = useRouter();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([]);
  const [creatingSession, setCreatingSession] = useState<string | null>(null);

  useEffect(() => {
    proceduresApi
      .list()
      .then(res => {
        const data = res as unknown as Procedure[];
        setProcedures(data);
        setFilteredProcedures(data);
      })
      .catch(err => {
        console.error('Failed to load procedures:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProcedures(procedures);
      return;
    }
    const lowerQ = searchQuery.toLowerCase();
    const filtered = procedures.filter(
      p =>
        p.name.toLowerCase().includes(lowerQ) ||
        p.code.toLowerCase().includes(lowerQ) ||
        (p.department && p.department.toLowerCase().includes(lowerQ))
    );
    setFilteredProcedures(filtered);
  }, [searchQuery, procedures]);

  const handleSelectProcedure = async (procedure: Procedure) => {
    setCreatingSession(procedure._id);
    try {
      const session = (await sessionsApi.create(procedure._id)) as unknown as { _id: string };
      router.push(`/upload/${session._id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Không thể tạo phiên làm việc. Vui lòng thử lại.');
      setCreatingSession(null);
    }
  };

  return (
    <CitizenLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dịch vụ công trực tuyến</h1>
          <p className="text-gray-600">Chọn thủ tục và để AI hỗ trợ kiểm tra hồ sơ tự động</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm thủ tục theo tên, mã, lĩnh vực..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách thủ tục...</p>
          </div>
        )}

        {/* Procedures Grid */}
        {!isLoading && filteredProcedures.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy thủ tục nào phù hợp.</p>
          </div>
        )}

        {!isLoading && filteredProcedures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProcedures.map(procedure => (
              <button
                key={procedure._id}
                onClick={() => handleSelectProcedure(procedure)}
                disabled={creatingSession === procedure._id}
                className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-lg hover:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Department tag */}
                {procedure.department && (
                  <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full mb-3">
                    {procedure.department}
                  </div>
                )}

                {/* Procedure name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {procedure.name}
                </h3>

                {/* Description */}
                {procedure.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{procedure.description}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Mã: {procedure.code}</span>
                  {procedure.priorityConfig?.slaDays && (
                    <span className="text-emerald-600 font-medium">
                      {procedure.priorityConfig.slaDays} ngày
                    </span>
                  )}
                </div>

                {/* Loading indicator */}
                {creatingSession === procedure._id && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Đang tạo phiên làm việc...</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
}

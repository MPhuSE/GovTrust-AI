'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { proceduresApi } from '@/lib/api-client';

const SUGGESTIONS = [
  'Đăng ký khai sinh cho con',
  'Cấp đổi Căn cước công dân (CCCD)',
  'Đăng ký kết hôn',
  'Xin cấp phép xây dựng',
  'Cấp giấy phép kinh doanh',
];

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Phát hiện lỗi tức thì',
    desc: 'AI phân tích hồ sơ ngay tại nhà, trước khi bạn đến cơ quan.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Tra cứu thủ tục dễ dàng',
    desc: 'Hơn 200+ thủ tục hành chính được cập nhật và hướng dẫn chi tiết.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: 'Tư vấn thông minh 24/7',
    desc: 'SmartBot trả lời mọi câu hỏi về giấy tờ, quy trình trong vài giây.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [query]);

  const handleStart = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = (await proceduresApi.identify(query)) as {
        procedureCode?: string;
        message?: string;
      };
      if (result.procedureCode) {
        router.push(`/procedures/${result.procedureCode}`);
      } else {
        setError(result.message ?? 'Chưa nhận diện được thủ tục. Vui lòng chọn từ danh sách.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleStart();
    }
  };

  const applySuggestion = (text: string) => {
    setQuery(text);
    setActiveSuggestion(null);
    textareaRef.current?.focus();
  };

  return (
    <main className="home-root">
      {/* Decorative blobs */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <div className="home-container">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Hệ thống AI hỗ trợ dịch vụ công
          </div>

          <h1 className="hero-title">
            <span className="hero-title-accent">GovTrust</span>{' '}
            <span className="hero-title-ai">AI</span>
          </h1>

          <p className="hero-subtitle">
            Kiểm tra hồ sơ dịch vụ công trước khi nộp<br className="hidden sm:block" />
            — <strong>phát hiện lỗi ngay tại nhà</strong>
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">200+</span>
              <span className="stat-label">Thủ tục</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">&lt;30s</span>
              <span className="stat-label">Phân tích</span>
            </div>
          </div>
        </section>

        {/* Search Card */}
        <section className="search-card" role="search">
          <label htmlFor="query-input" className="search-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Bạn cần làm thủ tục gì?
          </label>

          <div className="search-input-wrapper">
            <textarea
              id="query-input"
              ref={textareaRef}
              className="search-textarea"
              rows={2}
              placeholder={'Ví dụ: "Tôi muốn đăng ký khai sinh cho con" hoặc "Cấp đổi CCCD"'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button
                className="search-clear-btn"
                onClick={() => setQuery('')}
                title="Xóa nội dung"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions */}
          <div className="suggestions-row">
            <span className="suggestions-label">Gợi ý:</span>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className={`suggestion-chip${activeSuggestion === i ? ' active' : ''}`}
                onMouseEnter={() => setActiveSuggestion(i)}
                onMouseLeave={() => setActiveSuggestion(null)}
                onClick={() => applySuggestion(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-alert" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <button
            id="start-check-btn"
            className="start-btn"
            onClick={handleStart}
            disabled={isLoading || !query.trim()}
            type="button"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang phân tích...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
                </svg>
                Bắt đầu kiểm tra hồ sơ
              </>
            )}
          </button>

          <div className="browse-row">
            <Link href="/procedures" className="browse-link" id="browse-procedures-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Duyệt danh sách thủ tục
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <p className="keyboard-hint">
            Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để kiểm tra nhanh
          </p>
        </section>

        {/* Feature cards */}
        <section className="features-section" aria-label="Tính năng nổi bật">
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-card ${f.bg}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`feature-icon ${f.text} bg-white shadow-sm`}>
                {f.icon}
              </div>
              <div>
                <h3 className={`feature-title ${f.text}`}>{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Disclaimer */}
        <div className="disclaimer-box" role="note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 text-amber-600 mt-0.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p>
            <span className="font-semibold text-amber-800">Lưu ý: </span>
            <span className="text-amber-700">
              Thông tin trên chỉ mang tính tham khảo. Quyết định cuối cùng thuộc cơ quan có thẩm quyền.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}

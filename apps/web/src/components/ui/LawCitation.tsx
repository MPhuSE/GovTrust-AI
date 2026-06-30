import { ConfidenceBar } from './ConfidenceBar';

interface LawCitationProps {
  source: { title: string; article: string; url?: string };
  confidence: number;
  content: string;
}

export function LawCitation({ source, confidence, content }: LawCitationProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span>⚖️</span>
          Căn cứ pháp lý
        </h4>
        <span className="badge-info text-xs">LawGuard AI</span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">
        {content}
      </p>

      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-medium text-blue-700">
          {source.title} — {source.article}
        </span>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Xem nguồn
          </a>
        )}
      </div>

      <ConfidenceBar value={confidence * 100} />
    </div>
  );
}

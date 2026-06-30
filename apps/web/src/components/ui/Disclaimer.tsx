import { DISCLAIMER } from '@/lib/constants';

interface DisclaimerProps {
  text?: string;
}

export function Disclaimer({ text }: DisclaimerProps) {
  return (
    <div className="disclaimer-banner" role="note" aria-label="Lưu ý quan trọng">
      <span className="text-amber-600 text-base shrink-0">⚖️</span>
      <div>
        <span className="font-semibold">Lưu ý: </span>
        {text || DISCLAIMER}
      </div>
    </div>
  );
}

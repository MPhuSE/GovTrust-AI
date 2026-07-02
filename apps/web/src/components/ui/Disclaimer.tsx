import { DISCLAIMER } from '@/lib/constants';

export function Disclaimer() {
  return (
    <div className="disclaimer-banner" role="note">
      <span className="font-semibold">Lưu ý: </span>
      {DISCLAIMER}
    </div>
  );
}

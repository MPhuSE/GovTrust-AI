'use client';

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  size?: number;
}

const GRADE_CONFIG = {
  A: { color: '#22C55E', label: 'Xuất sắc', bgClass: 'bg-green-50' },
  B: { color: '#3B82F6', label: 'Tốt', bgClass: 'bg-blue-50' },
  C: { color: '#F59E0B', label: 'Khá — Cần Bổ Sung', bgClass: 'bg-yellow-50' },
  D: { color: '#EF4444', label: 'Cần Chuẩn Bị Thêm', bgClass: 'bg-red-50' },
};

export function ScoreCircle({ score, grade, size = 180 }: ScoreCircleProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = GRADE_CONFIG[grade];

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = animatedScore / 100;
  const dashOffset = circumference * (1 - progress);

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(eased * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          role="img"
          aria-label={`Điểm hồ sơ: ${score} trên 100`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="score-number" style={{ color: config.color }}>
            {animatedScore}
          </span>
          <span className="text-sm text-gray-400 -mt-1">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold ${config.bgClass}`}
        style={{ color: config.color }}
      >
        {grade === 'A' && '✅'}
        {grade === 'B' && 'ℹ️'}
        {grade === 'C' && '⚠️'}
        {grade === 'D' && '❌'}
        {config.label}
      </div>
    </div>
  );
}

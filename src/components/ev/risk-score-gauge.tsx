'use client';

import { cn } from '@/lib/utils';

interface RiskScoreGaugeProps {
  score: number;
  label?: string;
  size?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score <= 30) return 'text-red-500';
  if (score <= 60) return 'text-amber-500';
  if (score <= 80) return 'text-lime-500';
  return 'text-emerald-500';
}

function getTrackColor(score: number): string {
  if (score <= 30) return 'stroke-red-500';
  if (score <= 60) return 'stroke-amber-500';
  if (score <= 80) return 'stroke-lime-500';
  return 'stroke-emerald-500';
}

function getGlowColor(score: number): string {
  if (score <= 30) return 'shadow-red-500/20';
  if (score <= 60) return 'shadow-amber-500/20';
  if (score <= 80) return 'shadow-lime-500/20';
  return 'shadow-emerald-500/20';
}

export function RiskScoreGauge({
  score,
  label,
  size = 96,
  className,
}: RiskScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{ width: size, height: size }}
      >
        {/* SVG circular gauge */}
        <svg
          width={size}
          height={size}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              'transition-all duration-700 ease-out',
              getTrackColor(clampedScore)
            )}
          />
        </svg>

        {/* Score text */}
        <span
          className={cn(
            'absolute text-lg font-bold tabular-nums',
            getScoreColor(clampedScore)
          )}
        >
          {clampedScore}
        </span>
      </div>

      {label && (
        <span className="text-xs text-muted-foreground text-center leading-tight">
          {label}
        </span>
      )}
    </div>
  );
}
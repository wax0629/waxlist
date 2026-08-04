"use client";

import { useId } from "react";

/**
 * 5 stars, half-star = 1 point → score 1–10.
 * star 1 left=1 right=2 … star 5 left=9 right=10
 */

export function scoreToStars(score: number | null | undefined): number {
  if (score == null || score <= 0) return 0;
  return Math.min(5, Math.max(0, score / 2));
}

export function StarIcon({
  fill,
  size = 22,
  className = "",
}: {
  /** 0 | 0.5 | 1 */
  fill: 0 | 0.5 | 1;
  size?: number;
  className?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  const d =
    "M12 2.5l2.7 5.9 6.4.7-4.8 4.3 1.4 6.3L12 16.5 6.3 19.7l1.4-6.3-4.8-4.3 6.4-.7L12 2.5z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      {fill === 0.5 ? (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      ) : null}
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        opacity={0.4}
      />
      {fill === 1 ? (
        <path
          d={d}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      ) : null}
      {fill === 0.5 ? (
        <path
          d={d}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
          clipPath={`url(#${clipId})`}
        />
      ) : null}
    </svg>
  );
}

/** Read-only stars for avg display */
export function StarsDisplay({
  score,
  size = 16,
  className = "text-amber-300",
}: {
  /** 1–10 or null */
  score: number | null | undefined;
  size?: number;
  className?: string;
}) {
  const stars = scoreToStars(score);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const rem = stars - i;
        const fill: 0 | 0.5 | 1 =
          rem >= 1 ? 1 : rem >= 0.5 ? 0.5 : 0;
        return <StarIcon key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

/** Interactive 5-star picker (half-star steps → score 1–10) */
export function StarsPicker({
  value,
  hover,
  onHover,
  onPick,
  disabled,
  size = 28,
}: {
  value: number | null;
  hover: number | null;
  onHover: (score: number | null) => void;
  onPick: (score: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  // value/hover are scores 1–10; convert to 0–5 stars for fill
  const stars = scoreToStars(hover ?? value);

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => onHover(null)}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const leftScore = i * 2 + 1;
        const rightScore = i * 2 + 2;
        const rem = stars - i;
        const fill: 0 | 0.5 | 1 =
          rem >= 1 ? 1 : rem >= 0.5 ? 0.5 : 0;

        return (
          <span
            key={i}
            className="relative inline-flex cursor-pointer text-amber-300/90 transition hover:text-amber-200"
            style={{ width: size, height: size }}
          >
            <StarIcon fill={fill} size={size} className="pointer-events-none" />
            {/* left half → odd scores (half star) */}
            <button
              type="button"
              disabled={disabled}
              aria-label={`${leftScore} 分`}
              title={`${leftScore} 分`}
              className="absolute left-0 top-0 z-10 h-full w-1/2 disabled:cursor-default"
              onMouseEnter={() => onHover(leftScore)}
              onClick={() => onPick(leftScore)}
            />
            {/* right half → even scores (full star) */}
            <button
              type="button"
              disabled={disabled}
              aria-label={`${rightScore} 分`}
              title={`${rightScore} 分`}
              className="absolute right-0 top-0 z-10 h-full w-1/2 disabled:cursor-default"
              onMouseEnter={() => onHover(rightScore)}
              onClick={() => onPick(rightScore)}
            />
          </span>
        );
      })}
    </div>
  );
}

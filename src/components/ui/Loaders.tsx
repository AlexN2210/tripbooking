import type { CSSProperties } from 'react';

type LoaderProps = {
  className?: string;
  style?: CSSProperties;
  label?: string;
};

export function WaveLoader({ className = '', style, label = 'Chargement' }: LoaderProps) {
  return (
    <div
      className={`wave-loader ${className}`}
      style={style}
      role="status"
      aria-label={label}
    >
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function PalmLoader({ className = '', style, label = 'Chargement' }: LoaderProps) {
  return (
    <div
      className={`palm-loader ${className}`}
      style={style}
      role="status"
      aria-label={label}
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="palm-loader__svg"
      >
        <defs>
          <linearGradient id="palmStroke" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E6A83C" />
            <stop offset="0.55" stopColor="#26A56F" />
            <stop offset="1" stopColor="#2FC5FF" />
          </linearGradient>
        </defs>

        {/* trunk */}
        <path
          d="M36 62C36 49 33 41 30 34C27 27 26 20 30 14"
          stroke="url(#palmStroke)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* leaves */}
        <g className="palm-loader__leaves" stroke="url(#palmStroke)" strokeWidth="4" strokeLinecap="round">
          <path d="M30 16C20 14 14 18 10 24" />
          <path d="M30 16C22 10 16 10 10 12" />
          <path d="M30 16C24 6 18 4 12 4" />

          <path d="M30 16C40 14 48 18 62 24" />
          <path d="M30 16C38 10 46 10 62 12" />
          <path d="M30 16C36 6 44 4 60 4" />
        </g>

        {/* wave */}
        <path
          d="M10 58C16 54 20 54 26 58C32 62 36 62 42 58C48 54 52 54 62 58"
          stroke="url(#palmStroke)"
          strokeWidth="4"
          strokeLinecap="round"
          className="palm-loader__wave"
        />
      </svg>
    </div>
  );
}


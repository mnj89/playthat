import React from 'react';

interface PlayThatIconProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const PlayThatIcon: React.FC<PlayThatIconProps> = ({
  size = 40,
  className = '',
  withGlow = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-white/10 blur-md pointer-events-none"
        />
      )}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="pt-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <linearGradient id="pt-play-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="pt-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>

        {/* Squircle chassis */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#pt-bg-grad)"
          stroke="#f97316"
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />

        {/* Dynamic Speed Echo Waves with Orange Accent */}
        <path
          d="M16 20C16 20 19 24 19 32C19 40 16 44 16 44"
          stroke="url(#pt-wave-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M21 23C21 23 23.5 26.5 23.5 32C23.5 37.5 21 41 21 41"
          stroke="url(#pt-wave-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />

        {/* Primary Play Triangle in Vibrant Orange */}
        <polygon
          points="28,20 48,32 28,44"
          fill="url(#pt-play-grad)"
        />

        {/* Crisp White Spark */}
        <circle cx="48" cy="32" r="2.5" fill="#ffffff" />

        {/* Sub-grid Accents */}
        <line x1="32" y1="23" x2="32" y2="41" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
};

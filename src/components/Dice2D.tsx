import React from 'react';

interface Dice2DProps {
  value: number; // 1 to 6
  isShaking?: boolean;
  size?: number; // default 72
  className?: string;
}

export const Dice2D: React.FC<Dice2DProps> = ({
  value,
  isShaking = false,
  size = 72,
  className = '',
}) => {
  const pipColor = '#18181B'; // All black pips as required

  const renderPips = () => {
    switch (value) {
      case 1:
        return (
          <circle cx="36" cy="36" r="8" fill={pipColor} />
        );
      case 2:
        return (
          <>
            <circle cx="22" cy="22" r="6" fill={pipColor} />
            <circle cx="50" cy="50" r="6" fill={pipColor} />
          </>
        );
      case 3:
        return (
          <>
            <circle cx="20" cy="20" r="5.5" fill={pipColor} />
            <circle cx="36" cy="36" r="5.5" fill={pipColor} />
            <circle cx="52" cy="52" r="5.5" fill={pipColor} />
          </>
        );
      case 4:
        return (
          <>
            <circle cx="22" cy="22" r="5.5" fill={pipColor} />
            <circle cx="50" cy="22" r="5.5" fill={pipColor} />
            <circle cx="22" cy="50" r="5.5" fill={pipColor} />
            <circle cx="50" cy="50" r="5.5" fill={pipColor} />
          </>
        );
      case 5:
        return (
          <>
            <circle cx="21" cy="21" r="5.2" fill={pipColor} />
            <circle cx="51" cy="21" r="5.2" fill={pipColor} />
            <circle cx="36" cy="36" r="5.2" fill={pipColor} />
            <circle cx="21" cy="51" r="5.2" fill={pipColor} />
            <circle cx="51" cy="51" r="5.2" fill={pipColor} />
          </>
        );
      case 6:
        return (
          <>
            <circle cx="22" cy="18" r="5.2" fill={pipColor} />
            <circle cx="22" cy="36" r="5.2" fill={pipColor} />
            <circle cx="22" cy="54" r="5.2" fill={pipColor} />
            <circle cx="50" cy="18" r="5.2" fill={pipColor} />
            <circle cx="50" cy="36" r="5.2" fill={pipColor} />
            <circle cx="50" cy="54" r="5.2" fill={pipColor} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl shadow-lg transition-transform ${
        isShaking ? 'animate-dice-shake' : 'hover:scale-105'
      } ${className}`}
    >
      <svg
        viewBox="0 0 72 72"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-md select-none"
      >
        <defs>
          <linearGradient id="diceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0" />
          </filter>
        </defs>

        {/* Dice Body: White background with rounded corners */}
        <rect
          x="1.5"
          y="1.5"
          width="69"
          height="69"
          rx="14"
          ry="14"
          fill="url(#diceGrad)"
          stroke="#CBD5E1"
          strokeWidth="2"
        />

        {/* Subtle top inner edge highlight */}
        <line x1="16" y1="3.5" x2="56" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Traditional black pips */}
        {renderPips()}
      </svg>
    </div>
  );
};

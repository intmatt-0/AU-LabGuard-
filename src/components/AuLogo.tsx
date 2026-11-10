/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AuLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  subtitle?: string;
}

export const AuLogo: React.FC<AuLogoProps> = ({
  className = '',
  size = 42,
  withText = false,
  subtitle = 'Arellano University Malabon',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Outer Circular Seal Border */}
        <circle cx="50" cy="50" r="48" fill="#003087" stroke="#F5A623" strokeWidth="3.5" />
        <circle cx="50" cy="50" r="43" fill="#002263" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 2" />

        {/* Heraldic Shield */}
        <path
          d="M28 24 H72 V53 C72 70 50 84 50 84 C50 84 28 70 28 53 Z"
          fill="#003087"
          stroke="#F5A623"
          strokeWidth="2.2"
        />

        {/* AU Red Heraldic Chief Band */}
        <path d="M29 25 H71 V35 H29 Z" fill="#C8102E" />

        {/* Shield Vertical Split */}
        <path d="M50 35 V83" stroke="#F5A623" strokeWidth="1.2" opacity="0.65" />

        {/* Torch of Wisdom & Flaming Light */}
        <path d="M48 66 L46 46 H54 L52 66 Z" fill="#F5A623" />
        <line x1="46" y1="53" x2="54" y2="53" stroke="#002263" strokeWidth="1.2" />
        <line x1="47" y1="59" x2="53" y2="59" stroke="#002263" strokeWidth="1.2" />

        {/* Flame */}
        <path
          d="M50 32 C45 36 42 41 46 45 C48 48 52 48 54 45 C58 41 55 36 50 32 Z"
          fill="#F5A623"
        />
        <path
          d="M50 36 C48 39 47 41 49 44 C50 45 51 45 52 44 C54 41 52 39 50 36 Z"
          fill="#C8102E"
        />

        {/* Open Book of Knowledge */}
        <path
          d="M34 70 C41 68 48 70 50 73 C52 70 59 68 66 70 L65 63 C58 61 52 63 50 65 C48 63 42 61 35 63 Z"
          fill="#FFFFFF"
          stroke="#F5A623"
          strokeWidth="0.9"
        />

        {/* Year 1938 Header */}
        <text
          x="50"
          y="32"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.8"
          fontWeight="bold"
          fontFamily="Poppins, sans-serif"
          letterSpacing="1"
        >
          AU · 1938
        </text>
      </svg>

      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold font-heading tracking-tight text-white">
            LabGuard
          </span>
          <span className="text-xs font-medium text-blue-200">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};

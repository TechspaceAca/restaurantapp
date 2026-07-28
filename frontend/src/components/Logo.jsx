import React from 'react';

export function LogoIcon({ size = 42, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
    >
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4A2016" />
          <stop offset="70%" stopColor="#2D110B" />
          <stop offset="100%" stopColor="#1A0905" />
        </radialGradient>
        
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E29C" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#AA7C11" />
        </linearGradient>

        <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F5D061" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFF" stopOpacity="0.8" />
        </linearGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/>
        </filter>
      </defs>

      {/* Outer Circle Ring */}
      <circle cx="100" cy="100" r="96" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2" />
      <circle cx="100" cy="100" r="92" fill="url(#bgGrad)" stroke="url(#goldGrad)" strokeWidth="3" />
      <circle cx="100" cy="100" r="87" stroke="#8E5A2A" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.6" />

      {/* Sunburst Rays top */}
      <path d="M100 20 L100 28 M80 23 L84 30 M120 23 L116 30 M62 32 L68 37 M138 32 L132 37" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      {/* Brand Title: T CLOCK */}
      <text x="100" y="44" textAnchor="middle" fill="url(#goldGrad)" fontFamily="'Playfair Display', Georgia, serif" fontWeight="900" fontSize="24" letterSpacing="2">
        T
      </text>
      <text x="100" y="66" textAnchor="middle" fill="url(#goldGrad)" fontFamily="'Playfair Display', Georgia, serif" fontWeight="900" fontSize="22" letterSpacing="3">
        CLOCK
      </text>

      {/* Steam rising */}
      <path d="M88 102 C86 94 92 90 90 82" stroke="url(#steamGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M100 100 C98 90 104 86 102 76" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M112 102 C110 94 116 90 114 82" stroke="url(#steamGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

      {/* Coffee/Tea Cup Outer Shell */}
      <path d="M60 108 C60 148 140 148 140 108 Z" fill="#3D1A10" stroke="url(#goldGrad)" strokeWidth="3" />
      {/* Cup Handle */}
      <path d="M138 114 C158 114 158 136 136 138" stroke="url(#goldGrad)" strokeWidth="4.5" fill="none" strokeLinecap="round" />

      {/* Clock Face Inside Cup */}
      <circle cx="100" cy="126" r="23" fill="#FFFBEB" stroke="url(#goldGrad)" strokeWidth="2" />
      <circle cx="100" cy="126" r="21" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
      
      {/* Clock Roman Numerals */}
      <text x="100" y="112" textAnchor="middle" fill="#2D110B" fontSize="6" fontWeight="bold" fontFamily="serif">XII</text>
      <text x="117" y="128" textAnchor="middle" fill="#2D110B" fontSize="6" fontWeight="bold" fontFamily="serif">III</text>
      <text x="100" y="143" textAnchor="middle" fill="#2D110B" fontSize="6" fontWeight="bold" fontFamily="serif">VI</text>
      <text x="83" y="128" textAnchor="middle" fill="#2D110B" fontSize="6" fontWeight="bold" fontFamily="serif">IX</text>

      {/* Central 'T' & Clock Hands */}
      <text x="100" y="130" textAnchor="middle" fill="#B83227" fontSize="11" fontWeight="900" fontFamily="serif">T</text>
      <line x1="100" y1="126" x2="100" y2="116" stroke="#2D110B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="100" y1="126" x2="110" y2="126" stroke="#2D110B" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="100" cy="126" r="1.5" fill="#B83227" />

      {/* Leaf / Coffee Bean Accent */}
      <path d="M52 135 C44 125 58 120 62 130 C58 135 52 138 52 135 Z" fill="#75A045" stroke="url(#goldGrad)" strokeWidth="0.8" />
      <ellipse cx="145" cy="142" rx="4" ry="3" fill="#5C2C1D" transform="rotate(-20 145 142)" stroke="url(#goldGrad)" strokeWidth="0.8" />

      {/* Ribbon Banner for RESTO CAFE */}
      <path d="M45 158 Q100 168 155 158 L148 174 Q100 182 52 174 Z" fill="#912419" stroke="url(#goldGrad)" strokeWidth="1.5" />
      <text x="100" y="170" textAnchor="middle" fill="#FFFBEB" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="10" letterSpacing="2">
        RESTO CAFE
      </text>

      {/* Tagline Curve Text */}
      <path id="taglinePath" d="M35 178 Q100 205 165 178" fill="none"/>
      <text fill="url(#goldGrad)" fontSize="7.5" fontWeight="600" letterSpacing="0.5">
        <textPath href="#taglinePath" startOffset="50%" textAnchor="middle">
          Time for Tea, Time for Taste
        </textPath>
      </text>
    </svg>
  );
}

export function LogoFull({ size = 42, showSubtitle = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <LogoIcon size={size} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontSize: size * 0.42,
          fontWeight: 900,
          fontFamily: "'Playfair Display', serif",
          letterSpacing: '1px',
          background: 'linear-gradient(135deg, #F9E29C 0%, #D4AF37 50%, #B8860B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          T CLOCK
        </span>
        <span style={{
          fontSize: Math.max(size * 0.22, 10),
          fontWeight: 800,
          color: '#F59E0B',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginTop: 1,
        }}>
          RESTO CAFE
        </span>
        {showSubtitle && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 1 }}>
            Time for Tea, Time for Taste
          </span>
        )}
      </div>
    </div>
  );
}

export default LogoIcon;

import React, { useState } from 'react';
import { Scale } from 'lucide-react';
import logoImg from '../assets/logo.jpg';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customSizeClass?: string;
  showRing?: boolean;
  withGlow?: boolean;
  alt?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  customSizeClass = '',
  showRing = true,
  withGlow = false,
  alt = 'شعار التطبيق - HK Law',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 min-w-[28px]',
    sm: 'w-9 h-9 min-w-[36px]',
    md: 'w-11 h-11 sm:w-12 sm:h-12 min-w-[44px]',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 min-w-[56px]',
    xl: 'w-20 h-20 min-w-[80px]',
    '2xl': 'w-24 h-24 sm:w-28 sm:h-28 min-w-[96px]',
    custom: customSizeClass,
  };

  const selectedSizeClass = size === 'custom' ? customSizeClass : sizeClasses[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${selectedSizeClass} ${
        showRing ? 'ring-2 ring-amber-400/60 shadow-md shadow-amber-950/30' : ''
      } ${withGlow ? 'shadow-lg shadow-amber-500/30' : ''} ${className}`}
    >
      {!imageError ? (
        <img
          src={logoImg}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center rounded-full transform scale-102 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-slate-900 border border-amber-500/50 rounded-full flex items-center justify-center text-amber-400">
          <Scale className="w-1/2 h-1/2" />
        </div>
      )}
    </div>
  );
};

import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    default: 'bg-navy-600/40 text-soft-white border-navy-500/40',
    cyan: 'bg-cyan/10 text-cyan border-cyan/30 shadow-cyan-glow',
    success: 'bg-healthy/15 text-healthy border-healthy/30 shadow-green-glow',
    warning: 'bg-warning/15 text-warning border-warning/30 shadow-orange-glow',
    critical: 'bg-critical/15 text-critical border-critical/30 shadow-red-glow',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        variants[variant] || variants.default
      } ${sizes[size]} tracking-wide uppercase ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
};

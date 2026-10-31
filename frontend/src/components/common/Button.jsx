import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const base =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-cyan text-navy-950 font-semibold hover:bg-cyan-400 hover:shadow-cyan-glow focus:ring-cyan',
    secondary:
      'bg-navy-700/80 hover:bg-navy-600 text-soft-white border border-navy-500/50 hover:border-cyan/40 focus:ring-navy-500',
    outline:
      'bg-transparent hover:bg-cyan/10 text-cyan border border-cyan/40 hover:border-cyan focus:ring-cyan',
    danger:
      'bg-critical hover:bg-red-600 text-white shadow-red-glow focus:ring-critical',
    ghost:
      'bg-transparent hover:bg-navy-700/50 text-soft-muted hover:text-soft-white focus:ring-navy-600',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

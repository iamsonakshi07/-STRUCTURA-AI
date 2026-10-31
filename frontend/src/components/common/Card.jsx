import React from 'react';

export const Card = ({
  children,
  className = '',
  glow = false,
  hover = false,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-navy-800/80 border-navy-600/50',
    glass: 'glass-panel',
    subtle: 'bg-navy-900/60 border-navy-700/50',
    elevated: 'bg-navy-700/80 border-navy-600 shadow-xl',
  };

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md p-6 ${variants[variant] || variants.default} ${
        hover ? 'glass-panel-hover transition-all duration-200' : ''
      } ${glow ? 'shadow-cyan-glow border-cyan/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, icon: Icon, badge }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-soft-white tracking-wide">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-soft-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

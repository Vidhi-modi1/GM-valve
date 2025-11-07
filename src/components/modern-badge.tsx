import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'orange';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface ModernBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
  glow?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ModernBadge({
  children,
  variant = 'default',
  size = 'md',
  pulse = false,
  glow = false,
  icon,
  className = ''
}: ModernBadgeProps) {
  const variantClasses = {
    default: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300',
    success: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-300',
    warning: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-300',
    error: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300',
    info: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300',
    purple: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-300',
    orange: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2'
  };

  const glowClasses = {
    default: 'shadow-gray-200',
    success: 'shadow-green-200 animate-glow',
    warning: 'shadow-amber-200 animate-glow',
    error: 'shadow-red-200 animate-glow',
    info: 'shadow-blue-200 animate-glow',
    purple: 'shadow-purple-200 animate-glow',
    orange: 'shadow-orange-200 animate-glow'
  };

  return (
    <span
      className={`
        inline-flex items-center
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        border rounded-full
        font-medium
        transition-all duration-300
        hover:scale-105
        ${pulse ? 'animate-pulse-soft' : ''}
        ${glow ? glowClasses[variant] : ''}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'completed' | 'urgent';
  animated?: boolean;
}

export function StatusBadge({ status, animated = true }: StatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      variant: 'warning' as BadgeVariant,
      icon: '⏳',
      pulse: true
    },
    'in-progress': {
      label: 'In Progress',
      variant: 'info' as BadgeVariant,
      icon: '⚡',
      pulse: true
    },
    completed: {
      label: 'Completed',
      variant: 'success' as BadgeVariant,
      icon: '✓',
      pulse: false
    },
    urgent: {
      label: 'Urgent',
      variant: 'error' as BadgeVariant,
      icon: '🔥',
      pulse: true
    }
  };

  const { label, variant, icon, pulse } = config[status];

  return (
    <ModernBadge
      variant={variant}
      pulse={animated && pulse}
      glow={animated && pulse}
      icon={<span className="text-xs">{icon}</span>}
    >
      {label}
    </ModernBadge>
  );
}

interface PriorityBadgeProps {
  priority: 'normal' | 'urgent';
  animated?: boolean;
}

export function PriorityBadge({ priority, animated = true }: PriorityBadgeProps) {
  if (priority === 'normal') {
    return (
      <ModernBadge variant="default" size="sm">
        Normal
      </ModernBadge>
    );
  }

  return (
    <ModernBadge
      variant="error"
      size="sm"
      pulse={animated}
      glow={animated}
      icon={<span className="text-xs">🚨</span>}
    >
      Urgent
    </ModernBadge>
  );
}

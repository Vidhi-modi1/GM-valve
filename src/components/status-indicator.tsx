import React from 'react';
import { Circle, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

export type StatusType = 'pending' | 'in-progress' | 'completed' | 'urgent' | 'on-hold' | 'cancelled';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

const statusConfig: Record<StatusType, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  pending: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: Clock,
    label: 'Pending'
  },
  'in-progress': {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: Circle,
    label: 'In Progress'
  },
  completed: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: CheckCircle2,
    label: 'Completed'
  },
  urgent: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: AlertCircle,
    label: 'Urgent'
  },
  'on-hold': {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: Circle,
    label: 'On Hold'
  },
  cancelled: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: XCircle,
    label: 'Cancelled'
  }
};

const sizeClasses = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3',
    dot: 'w-1.5 h-1.5'
  },
  md: {
    badge: 'px-3 py-1 text-sm',
    icon: 'h-3.5 w-3.5',
    dot: 'w-2 h-2'
  },
  lg: {
    badge: 'px-4 py-1.5 text-base',
    icon: 'h-4 w-4',
    dot: 'w-2.5 h-2.5'
  }
};

export function StatusIndicator({
  status,
  label,
  size = 'md',
  showIcon = true,
  pulse = false
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const sizeClass = sizeClasses[size];

  return (
    <span className={`
      inline-flex items-center gap-1.5
      ${config.bgColor} ${config.color} ${config.borderColor}
      border rounded-full
      font-medium
      ${sizeClass.badge}
      transition-all duration-300
      hover:scale-105
      ${pulse ? 'animate-pulse-soft' : ''}
    `}>
      {showIcon && (
        <Icon className={`${sizeClass.icon} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {label || config.label}
    </span>
  );
}

// Dot indicator for compact spaces
export function StatusDot({ status, pulse = false }: { status: StatusType; pulse?: boolean }) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`
        inline-block w-2 h-2 rounded-full
        ${config.bgColor.replace('100', '500')}
        ${pulse ? 'animate-pulse' : ''}
      `}
      title={config.label}
    />
  );
}

// Progress bar for workflow steps
export function StatusProgress({ 
  current, 
  total, 
  showLabels = true 
}: { 
  current: number; 
  total: number; 
  showLabels?: boolean;
}) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-1">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#174a9f] to-indigo-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-600">
          <span>{current} of {total} steps</span>
          <span className="font-medium text-[#174a9f]">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

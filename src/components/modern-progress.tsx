import React from 'react';

interface ModernProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showLabel?: boolean;
  animated?: boolean;
}

export function ModernProgress({ 
  value, 
  max = 100, 
  size = 'md',
  color = 'blue',
  showLabel = true,
  animated = true
}: ModernProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorClasses = {
    blue: 'from-[#174a9f] via-[#2461c7] to-[#174a9f]',
    green: 'from-green-500 via-emerald-500 to-green-500',
    purple: 'from-purple-500 via-violet-500 to-purple-500',
    orange: 'from-orange-500 via-amber-500 to-orange-500'
  };

  return (
    <div className="w-full space-y-2">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-r ${colorClasses[color]}
            rounded-full transition-all duration-500 ease-out
            ${animated ? 'progress-gradient' : ''}
            relative overflow-hidden
          `}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#174a9f',
  showLabel = true
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

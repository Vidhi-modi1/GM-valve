import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  trend?: {
    value: string;
    positive: boolean;
  };
}

interface ModernPageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  stats?: Stat[];
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
}

export function ModernPageHeader({
  title,
  description,
  icon: Icon,
  actions,
  stats,
  breadcrumbs
}: ModernPageHeaderProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    red: 'bg-red-100 text-red-600 border-red-200'
  };

  return (
    <div className="space-y-6 mb-8 animate-fade-in-up">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="hover:text-[#174a9f] transition-colors duration-200"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="p-3 bg-gradient-to-br from-[#174a9f] to-indigo-600 rounded-xl shadow-lg">
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-gray-900 mb-2 group">
              {title}
              <span className="inline-block ml-2 w-0 h-1 bg-[#174a9f] group-hover:w-12 transition-all duration-300 rounded-full align-middle"></span>
            </h1>
            {description && (
              <p className="text-gray-600 max-w-2xl">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {stat.label}
                  </span>
                  {stat.icon && (
                    <div className={`p-2 rounded-lg border ${stat.color ? colorClasses[stat.color] : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      <stat.icon className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  
                  {stat.trend && (
                    <div className={`text-xs font-medium ${stat.trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="inline-block mr-0.5">
                        {stat.trend.positive ? '↗' : '↘'}
                      </span>
                      {stat.trend.value}
                    </div>
                  )}
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

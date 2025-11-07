import React from 'react';
import { LucideIcon, Package, Search, Filter, Database } from 'lucide-react';
import { Button } from './ui/button';

interface ModernEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  type?: 'default' | 'search' | 'filter' | 'empty';
}

export function ModernEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  type = 'default'
}: ModernEmptyStateProps) {
  const defaultIcons = {
    default: Package,
    search: Search,
    filter: Filter,
    empty: Database
  };

  const Icon = icon || defaultIcons[type];
  const ActionIcon = action?.icon;

  return (
    <div className="flex items-center justify-center py-16 px-4 animate-fade-in">
      <div className="text-center max-w-md">
        {/* Icon Container with Animation */}
        <div className="relative inline-block mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#174a9f]/20 to-indigo-400/20 blur-2xl rounded-full animate-pulse-soft"></div>
          
          {/* Icon background */}
          <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center animate-float">
            <div className="absolute inset-2 bg-white rounded-full"></div>
            <Icon className="relative h-8 w-8 text-gray-400" />
          </div>

          {/* Decorative dots */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#174a9f]/20 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-gradient-to-r from-[#174a9f] to-indigo-600 hover:from-[#123a80] hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              {ActionIcon && <ActionIcon className="h-4 w-4 mr-2 relative z-10" />}
              <span className="relative z-10">{action.label}</span>
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="hover:bg-gray-50 transition-all duration-200"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface FilterGroup {
  label: string;
  content: React.ReactNode;
  badge?: string;
}

interface ModernFilterPanelProps {
  groups: FilterGroup[];
  defaultExpanded?: boolean;
  onClear?: () => void;
  activeFiltersCount?: number;
}

export function ModernFilterPanel({
  groups,
  defaultExpanded = true,
  onClear,
  activeFiltersCount = 0
}: ModernFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="relative bg-gradient-to-br from-white via-white/95 to-blue-50/30 backdrop-blur-md border-2 border-[#174a9f]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#174a9f]/5 to-transparent rounded-bl-full animate-pulse-soft"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/5 to-transparent rounded-tr-full animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#174a9f] to-indigo-600 rounded-lg shadow-sm">
            <SlidersHorizontal className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {activeFiltersCount} active
              </p>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Badge className="bg-[#174a9f] hover:bg-[#123a80] text-white ml-2 animate-pulse-soft">
              {activeFiltersCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClear && activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-[#174a9f] hover:bg-[#174a9f]/10 transition-all duration-300"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform duration-300" />
            )}
          </Button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="relative z-10 p-6 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <div
                key={index}
                className="space-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    {group.label}
                  </label>
                  {group.badge && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-[#174a9f] border-[#174a9f]/30">
                      {group.badge}
                    </Badge>
                  )}
                </div>
                {group.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

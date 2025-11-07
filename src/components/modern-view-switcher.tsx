import React from 'react';
import { LayoutGrid, List, Kanban } from 'lucide-react';
import { Button } from './ui/button';

export type ViewType = 'table' | 'grid' | 'kanban';

interface ModernViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  availableViews?: ViewType[];
}

export function ModernViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ['table', 'grid', 'kanban']
}: ModernViewSwitcherProps) {
  const views = [
    { type: 'table' as ViewType, icon: List, label: 'Table View' },
    { type: 'grid' as ViewType, icon: LayoutGrid, label: 'Grid View' },
    { type: 'kanban' as ViewType, icon: Kanban, label: 'Kanban View' }
  ].filter(view => availableViews.includes(view.type));

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg shadow-sm">
      {views.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(type)}
          className={`
            h-8 px-3 gap-2 transition-all duration-200
            ${currentView === type 
              ? 'bg-gradient-to-r from-[#174a9f] to-indigo-600 text-white shadow-md hover:from-[#123a80] hover:to-indigo-700' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
          title={label}
        >
          <Icon className={`h-4 w-4 ${currentView === type ? 'animate-scale-in' : ''}`} />
          <span className="hidden sm:inline text-sm">{label.replace(' View', '')}</span>
        </Button>
      ))}
    </div>
  );
}

// Density switcher for table views
export type DensityType = 'comfortable' | 'compact' | 'spacious';

interface DensitySwitcherProps {
  currentDensity: DensityType;
  onDensityChange: (density: DensityType) => void;
}

export function DensitySwitcher({
  currentDensity,
  onDensityChange
}: DensitySwitcherProps) {
  const densities: Array<{ type: DensityType; label: string }> = [
    { type: 'compact', label: 'Compact' },
    { type: 'comfortable', label: 'Comfortable' },
    { type: 'spacious', label: 'Spacious' }
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-lg shadow-sm">
      {densities.map(({ type, label }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => onDensityChange(type)}
          className={`
            h-8 px-3 transition-all duration-200 text-xs
            ${currentDensity === type 
              ? 'bg-[#174a9f] text-white shadow-sm hover:bg-[#123a80]' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

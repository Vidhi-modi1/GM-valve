import React from 'react';
import { Search, Filter, Download, Upload, RefreshCw, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface ModernActionBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onAdd?: () => void;
  addButtonText?: string;
  filterComponent?: React.ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  additionalActions?: React.ReactNode;
  selectedCount?: number;
  bulkActions?: React.ReactNode;
}

export function ModernActionBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onRefresh,
  onExport,
  onImport,
  onAdd,
  addButtonText = 'Add New',
  filterComponent,
  activeFiltersCount = 0,
  onClearFilters,
  additionalActions,
  selectedCount = 0,
  bulkActions
}: ModernActionBarProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Main Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Left Section - Search */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 bg-white/90 backdrop-blur-sm border-gray-200/60 hover:border-[#174a9f]/30 focus:border-[#174a9f] transition-all duration-200 shadow-sm hover:shadow-md"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {additionalActions}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9 px-3 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
            >
              <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </Button>
          )}

          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="h-9 px-3 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-9 px-3 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          {onAdd && (
            <Button
              size="sm"
              onClick={onAdd}
              className="h-9 px-4 bg-gradient-to-r from-[#174a9f] to-indigo-600 hover:from-[#123a80] hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
              <Plus className="h-4 w-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
              <span className="relative z-10">{addButtonText}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {filterComponent && (
        <div className="relative">
          {filterComponent}
          
          {/* Active Filters Badge */}
          {activeFiltersCount > 0 && (
            <div className="absolute -top-2 -right-2 z-20">
              <Badge className="bg-[#174a9f] hover:bg-[#123a80] text-white px-2 py-1 rounded-full shadow-lg animate-pulse-soft">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Clear Filters */}
      {activeFiltersCount > 0 && onClearFilters && (
        <div className="flex items-center gap-3 p-3 bg-blue-50/80 backdrop-blur-sm border border-blue-200/60 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-[#174a9f]" />
            <span className="text-sm text-[#174a9f] font-medium">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} applied
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-[#174a9f] hover:bg-blue-100 hover:text-[#123a80]"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && bulkActions && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200/60 rounded-xl animate-slide-in-right shadow-md">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-semibold text-sm">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions}
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchValue && onSearchChange && (
        <div className="p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-900">
              Searching for: <span className="font-semibold">"{searchValue}"</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

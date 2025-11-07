import React, { useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sticky?: 'left' | 'right';
  stickyOffset?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface ModernDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
  pagination?: {
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  };
}

export function ModernDataTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
  hoverable = true,
  striped = false,
  compact = false,
  pagination
}: ModernDataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const totalPages = pagination ? Math.ceil(sortedData.length / pagination.pageSize) : 1;

  const getStickyClass = (column: Column<T>) => {
    if (!column.sticky) return '';
    
    const baseClass = `sticky ${column.sticky === 'left' ? 'left' : 'right'}-${column.stickyOffset || '0'} z-10`;
    return baseClass;
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="relative overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`
                      px-4 ${compact ? 'py-2' : 'py-3'}
                      text-left text-xs font-semibold text-gray-700 uppercase tracking-wider
                      border-r border-gray-200/60 last:border-r-0
                      bg-white/50
                      ${getStickyClass(column)}
                      ${column.sortable ? 'cursor-pointer hover:bg-gray-100/50 select-none' : ''}
                      ${column.className || ''}
                      transition-colors duration-200
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && (
                        <ArrowUpDown className={`h-3.5 w-3.5 ${sortColumn === column.key ? 'text-[#174a9f]' : 'text-gray-400'}`} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-3 border-[#174a9f] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      group
                      ${hoverable ? 'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 cursor-pointer' : ''}
                      ${striped && index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      transition-all duration-200
                      hover:shadow-sm
                    `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          px-4 ${compact ? 'py-2.5' : 'py-3.5'}
                          text-sm text-gray-900
                          border-r border-gray-200/40 last:border-r-0
                          ${getStickyClass(column)}
                          ${column.sticky ? 'bg-white group-hover:bg-gradient-to-r group-hover:from-blue-50/50 group-hover:to-indigo-50/30' : ''}
                          ${column.className || ''}
                          transition-colors duration-200
                        `}
                        style={{ width: column.width }}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`h-8 w-8 p-0 ${
                      pagination.currentPage === pageNum
                        ? 'bg-[#174a9f] hover:bg-[#123a7f]'
                        : ''
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

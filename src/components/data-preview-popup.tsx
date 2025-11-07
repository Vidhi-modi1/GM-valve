import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { ScrollArea } from "./ui/scroll-area";

interface DataPreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<Record<string, any>>;
  filename: string;
}

export const DataPreviewPopup = React.memo(function DataPreviewPopup({ isOpen, onClose, data, filename }: DataPreviewPopupProps) {
  // Memoize data processing to prevent re-computation on every render
  const { safeData, columns, validRows, invalidRows } = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const columns = safeData.length > 0 ? Object.keys(safeData[0]) : [];
    const validRows = safeData.filter(row => 
      row && typeof row === 'object' && Object.values(row).some(value => 
        value !== null && value !== undefined && value !== ''
      )
    );
    const invalidRows = safeData.filter(row => 
      !row || typeof row !== 'object' || Object.values(row).every(value => 
        value === null || value === undefined || value === ''
      )
    );
    
    return { safeData, columns, validRows, invalidRows };
  }, [data]);

  const handleImport = () => {
    console.log('Importing data:', validRows);
    // Here you would handle the actual import logic
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/60">
        <DialogHeader className="pb-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Download className="h-5 w-5 text-[#174a9f]" />
                Data Preview - {filename}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Review and validate your Excel data before importing
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50/80 backdrop-blur-sm p-4 rounded-xl border border-green-200/50 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Valid Rows</p>
                  <p className="text-2xl font-semibold text-green-800">{validRows.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50/80 backdrop-blur-sm p-4 rounded-xl border border-amber-200/50 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-700">Empty Rows</p>
                  <p className="text-2xl font-semibold text-amber-800">{invalidRows.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#e8f0f9]/80 backdrop-blur-sm p-4 rounded-xl border border-[#a3c4e7]/50 shadow-sm">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-[#174a9f]" />
                <div>
                  <p className="font-medium text-[#123a7f]">Total Columns</p>
                  <p className="text-2xl font-semibold text-[#0d2a5f]">{columns.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column Headers */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Detected Columns</h3>
            <div className="flex flex-wrap gap-2">
              {columns.map((column, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-[#e8f0f9] text-[#123a7f] border-[#a3c4e7]"
                >
                  {column}
                </Badge>
              ))}
            </div>
          </div>

          {/* Data Table Preview */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Data Preview (First 10 rows)</h3>
            {validRows.length === 0 ? (
              <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-200/60">
                <p className="text-gray-500">No valid data found in the uploaded file.</p>
              </div>
            ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
              <ScrollArea className="h-80 w-full">
                <div className="min-w-full overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/90 backdrop-blur-sm sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Row
                        </th>
                        {columns.map((column, index) => (
                          <th 
                            key={index}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {validRows.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-medium">
                            {rowIndex + 1}
                          </td>
                          {columns.map((column, colIndex) => (
                            <td 
                              key={colIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row && row[column] !== null && row[column] !== undefined 
                                ? String(row[column]) 
                                : '-'
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>
            )}
          </div>

          {/* Validation Warnings */}
          {invalidRows.length > 0 && (
            <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Data Validation Warning</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {invalidRows.length} empty rows detected and will be skipped during import.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              className="bg-[#174a9f] hover:bg-[#123a7f]"
              disabled={validRows.length === 0}
            >
              Import {validRows.length} Rows
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
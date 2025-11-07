import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToOrders: () => void;
}

export function AddOrderModal({ isOpen, onClose, onNavigateToOrders }: AddOrderModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Accept Excel files and CSV files
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (allowedTypes.includes(file.type) || hasValidExtension) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid Excel file (.xlsx, .xls) or CSV file (.csv)');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      // Simulate file upload processing
      setIsSubmitted(true);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsSubmitted(false);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleNavigateToOrders = () => {
    handleClose();
    onNavigateToOrders();
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Upload Successful</DialogTitle>
            <DialogDescription>
              Your file has been uploaded successfully and your new order has been added.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your file is uploaded successfully. Check your uploaded order in the Order menu.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="px-6"
              >
                Close
              </Button>
              <Button 
                onClick={handleNavigateToOrders}
                className="px-6 bg-[#1457f6] hover:bg-[#1145d4] text-white"
              >
                Go to Orders
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900 text-center">
            Add New Order
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-center">
            Upload an Excel or CSV file to add new orders to your system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${isDragOver 
                ? 'border-[#174a9f] bg-[#e8f0f9]' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${selectedFile ? 'bg-green-50 border-green-300' : ''}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {selectedFile ? (
              // File Selected State
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              // File Upload State
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-gray-500 mb-4">
                    or
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleChooseFile}
                    className="border-[#174a9f] text-[#174a9f] hover:bg-[#e8f0f9]"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  Supports Excel files (.xlsx, .xls) and CSV files (.csv)
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleClose} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className="px-6 bg-[#1457f6] hover:bg-[#1145d4] text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
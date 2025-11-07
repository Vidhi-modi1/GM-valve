import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, CalendarIcon, Printer, ArrowRight, Search, Siren, Eye, MessageSquarePlus } from 'lucide-react';
import { StatusDropdown, StatusType } from './status-dropdown';
import { AddOrderModal } from './add-order-modal';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { useOrderContext } from './order-context';
import { OrderFilters } from './order-filters';

interface AssemblyOrderData {
  id: string;
  assemblyLine: string;
  gmsoaNo: string;
  soaSrNo: string;
  assemblyDate: string;
  uniqueCode: string;
  splittedCode: string;
  party: string;
  customerPoNo: string;
  codeNo: string;
  product: string;
  qty: number;
  qtyExe: number;
  qtyPending: number;
  finishedValve: string;
  gmLogo: string;
  namePlate: string;
  productSpcl1: string;
  productSpcl2: string;
  productSpcl3: string;
  inspection: string;
  painting: string;
  remarks: string;
  alertStatus: boolean;
}

const mockAssemblyOrders: AssemblyOrderData[] = [
  {
    id: '1',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 0,
    qtyPending: 36,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false
  },
  {
    id: '3',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '7',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-7',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '40GT8AH12T80C8H1G29',
    product: '40MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 2,
    qtyExe: 0,
    qtyPending: 2,
    finishedValve: '',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: 'Body - Bonnet Heat no. C4AH ,  NABL Lab tests Require , TC Depatment use Trim Material & Gasket as Per UNS S32205',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false
  },
  {
    id: '5',
    assemblyLine: 'D',
    gmsoaNo: 'SOA0918',
    soaSrNo: '3',
    assemblyDate: 'HOLD',
    uniqueCode: 'ORD-0918-2025-3',
    splittedCode: '',
    party: 'John Crane Middle East F.Z.E.',
    customerPoNo: '4503254953',
    codeNo: 'OTB40GT9D13T12WBH2S2S3(0918)',
    product: 'OTB-40MM-GTV-1500#-F316/L(SS316/L)-BW160-T12(SS316+HST6)-WELDED-HBLK-LOCKING ARR.-FULL BORE-(0918)',
    qty: 1,
    qtyExe: 0,
    qtyPending: 1,
    finishedValve: '',
    gmLogo: 'GM',
    namePlate: 'GM',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'NACE,IGC-E,PMI',
    productSpcl3: '',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false
  }
];

interface OrdersPageProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onNavigateToOrders?: () => void;
  showAddOrderModal?: boolean;
  setShowAddOrderModal?: (show: boolean) => void;
}

export function OrdersPage2({ searchTerm = '', onSearchChange, onNavigateToOrders, showAddOrderModal = false, setShowAddOrderModal }: OrdersPageProps) {
  
  const { remarks, alertStatuses, updateRemark, toggleAlertStatus: toggleAlertStatusContext, getRemark, getAlertStatus } = useOrderContext();

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrderData | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<AssemblyOrderData | null>(null);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<AssemblyOrderData | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  
  // Filter states
  const [assemblyLineFilter, setAssemblyLineFilter] = useState('all');
  const [gmsoaFilter, setGmsoaFilter] = useState('all');
  const [partyFilter, setPartyFilter] = useState('all');
  const [dateFilterMode, setDateFilterMode] = useState<'year' | 'month' | 'range'>('range');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Ref for table scrolling
  const tableScrollRef = useRef<HTMLDivElement>(null);
  
  // Quick assign state
  const [quickAssignStep, setQuickAssignStep] = useState('');
  const [quickAssignQty, setQuickAssignQty] = useState('');
  const [splitOrder, setSplitOrder] = useState(false);
  const [splitAssignStep, setSplitAssignStep] = useState('');
  const [splitAssignQty, setSplitAssignQty] = useState('');
  const [quickAssignErrors, setQuickAssignErrors] = useState<{[key: string]: string}>({});

  // Use localSearchTerm if onSearchChange is not provided
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;

  // Get unique filter options
  const assemblyLines = useMemo(() => 
    Array.from(new Set(mockAssemblyOrders.map(o => o.assemblyLine))).sort(),
    []
  );
  const gmsoaNos = useMemo(() => 
    Array.from(new Set(mockAssemblyOrders.map(o => o.gmsoaNo))).sort(),
    []
  );
  const assemblyDates = useMemo(() => 
    Array.from(new Set(mockAssemblyOrders.map(o => o.assemblyDate))).sort(),
    []
  );
  const parties = useMemo(() => 
    Array.from(new Set(mockAssemblyOrders.map(o => o.party))).sort(),
    []
  );

  // Filter orders based on search term, filters, and urgent filter (memoized for performance)
  const filteredOrders = useMemo(() => {
    let orders = mockAssemblyOrders;
    
    // Filter by urgent/alert status if enabled
    if (showUrgentOnly) {
      orders = orders.filter(order => getAlertStatus(order.id) === true);
    }
    
    // Filter by Assembly Line
    if (assemblyLineFilter !== 'all') {
      orders = orders.filter(order => order.assemblyLine === assemblyLineFilter);
    }
    
    // Filter by GMSOA NO
    if (gmsoaFilter !== 'all') {
      orders = orders.filter(order => order.gmsoaNo === gmsoaFilter);
    }
    
    // Filter by Party
    if (partyFilter !== 'all') {
      orders = orders.filter(order => order.party === partyFilter);
    }
    
    // Filter by date (year/month/range)
    if (dateFrom || dateTo) {
      orders = orders.filter(order => {
        // Skip orders with non-date assembly dates like "HOLD"
        if (order.assemblyDate === 'HOLD' || !order.assemblyDate) {
          return false;
        }
        
        // Parse DD-MM-YYYY format to Date object
        const [day, month, year] = order.assemblyDate.split('-').map(Number);
        const orderDate = new Date(year, month - 1, day); // month is 0-indexed
        
        // Check if date is valid
        if (isNaN(orderDate.getTime())) {
          return false;
        }
        
        // Year filter
        if (dateFilterMode === 'year' && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear();
        }
        
        // Month filter
        if (dateFilterMode === 'month' && dateFrom) {
          return orderDate.getFullYear() === dateFrom.getFullYear() && 
                 orderDate.getMonth() === dateFrom.getMonth();
        }
        
        // Date range filter
        if (dateFilterMode === 'range') {
          if (dateFrom && dateTo) {
            return orderDate >= dateFrom && orderDate <= dateTo;
          } else if (dateFrom) {
            return orderDate >= dateFrom;
          } else if (dateTo) {
            return orderDate <= dateTo;
          }
        }
        
        return true;
      });
    }
    
    // Filter by search term
    if (!effectiveSearchTerm.trim()) return orders;
    
    const lowerSearchTerm = effectiveSearchTerm.toLowerCase();
    return orders.filter(order =>
      order.uniqueCode.toLowerCase().includes(lowerSearchTerm) ||
      order.party.toLowerCase().includes(lowerSearchTerm) ||
      order.gmsoaNo.toLowerCase().includes(lowerSearchTerm)
    );
  }, [effectiveSearchTerm, showUrgentOnly, assemblyLineFilter, gmsoaFilter, partyFilter, dateFilterMode, dateFrom, dateTo, alertStatuses]);

  // Check if filters are active
  const hasActiveFilters = assemblyLineFilter !== 'all' || gmsoaFilter !== 'all' || 
                           partyFilter !== 'all' ||
                           dateFrom !== undefined || dateTo !== undefined;

  // Clear all filters
  const clearFilters = () => {
    setAssemblyLineFilter('all');
    setGmsoaFilter('all');
    setPartyFilter('all');
    setDateFilterMode('range');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Toggle alert status
  const toggleAlertStatus = (orderId: string) => {
    toggleAlertStatusContext(orderId);
  };

  // Handle individual row selection
  const toggleRowSelection = (orderId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedRows.size === filteredOrders.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredOrders.map(order => order.id)));
    }
  };

  // Check if all rows are selected
  const allRowsSelected = filteredOrders.length > 0 && selectedRows.size === filteredOrders.length;

  // Get selected orders data
  const selectedOrdersData = mockAssemblyOrders.filter(order => selectedRows.has(order.id));

  // Show bin card dialog
  const handleShowBinCard = () => {
    setBinCardDialogOpen(true);
  };

  // Print bin card
  const handlePrintBinCard = () => {
    window.print();
  };

  // View order details
  const handleViewDetails = (order: AssemblyOrderData) => {
    setViewedOrder(order);
    setViewDetailsDialogOpen(true);
  };

  // Open remarks dialog
  const handleOpenRemarks = (order: AssemblyOrderData) => {
    setRemarksOrder(order);
    setRemarksText(getRemark(order.id) || order.remarks || '');
    setRemarksDialogOpen(true);
  };

  // Save remarks
  const handleSaveRemarks = () => {
    if (remarksOrder) {
      // Update the remarks in shared context
      updateRemark(remarksOrder.id, remarksText);
      setRemarksDialogOpen(false);
      setRemarksOrder(null);
      setRemarksText('');
    }
  };

  // PDF Print functionality
  const handlePrint = () => {
    try {
      // Import jsPDF dynamically to avoid build issues
      import('jspdf').then(({ default: jsPDF }) => {
        // Create new PDF document
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Add header
        pdf.setFontSize(18);
        pdf.setTextColor(31, 41, 55); // Gray-800
        pdf.text('Material Issue Report', 20, 20);
        
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128); // Gray-500
        pdf.text('Track and manage assembly line orders and manufacturing workflow', 20, 28);
        
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81); // Gray-700
        pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 36);
        
        // Table headers
        let yPos = 50;
        const lineHeight = 7;
        const columnWidths = [20, 20, 15, 20, 20, 20, 25, 20, 15, 25, 12, 12, 15];
        const startX = 10;
        
        // Draw table header
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        
        const headers = ['Assembly Line', 'GMSOA NO.', 'SOA Sr. No.', 'Assembly Date', 'Unique Code', 'Splitted Code', 'Party', 'Customer PO', 'Code No', 'Product', 'Qty', 'Qty Exe', 'Qty Pending'];
        let xPos = startX;
        
        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPos);
          xPos += columnWidths[index];
        });
        
        yPos += lineHeight + 2;
        
        // Draw line under header
        pdf.line(startX, yPos - 1, startX + columnWidths.reduce((a, b) => a + b, 0), yPos - 1);
        
        // Add table data
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(6);
        
        filteredOrders.forEach((order) => {
          if (yPos > 190) { // Check if we need a new page
            pdf.addPage();
            yPos = 20;
            
            // Redraw header on new page
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(7);
            let xPosHeader = startX;
            headers.forEach((header, headerIndex) => {
              pdf.text(header, xPosHeader, yPos);
              xPosHeader += columnWidths[headerIndex];
            });
            yPos += lineHeight + 2;
            pdf.line(startX, yPos - 1, startX + columnWidths.reduce((a, b) => a + b, 0), yPos - 1);
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(6);
          }
          
          xPos = startX;
          const rowData = [
            order.assemblyLine,
            order.gmsoaNo,
            order.soaSrNo,
            order.assemblyDate,
            order.uniqueCode,
            order.splittedCode,
            order.party,
            order.customerPoNo,
            order.codeNo,
            order.product,
            order.qty.toString(),
            order.qtyExe.toString(),
            order.qtyPending.toString()
          ];
          
          rowData.forEach((data, dataIndex) => {
            // Truncate text if too long for column
            const maxWidth = columnWidths[dataIndex] - 2;
            let text = data;
            if (pdf.getTextWidth(text) > maxWidth) {
              while (pdf.getTextWidth(text + '...') > maxWidth && text.length > 0) {
                text = text.slice(0, -1);
              }
              text += '...';
            }
            
            pdf.text(text, xPos, yPos);
            xPos += columnWidths[dataIndex];
          });
          
          yPos += lineHeight;
        });
        
        // Add footer with total count
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(107, 114, 128);
          pdf.text(
            `Total Orders: ${filteredOrders.length} | Page ${i} of ${pageCount}`,
            20,
            pdf.internal.pageSize.height - 10
          );
        }
        
        // Save the PDF
        const fileName = `Material_Issue_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Quick assign handlers
  const handleQuickAssign = (order: AssemblyOrderData) => {
    setSelectedOrder(order);
    // Set default workflow step based on finishedValve value
    const defaultStep = order.finishedValve === 'yes' ? 'finished-valve-store' : 'semi-qc';
    setQuickAssignStep(defaultStep);
    setQuickAssignQty(order.qtyPending.toString());
    setSplitOrder(false);
    setSplitAssignStep('');
    setSplitAssignQty('');
    setQuickAssignErrors({});
    setQuickAssignOpen(true);
  };

  const validateQuickAssign = () => {
    const errors: {[key: string]: string} = {};
    const maxQty = selectedOrder?.qtyPending || 0;
    const mainQty = Number(quickAssignQty) || 0;
    const splitQty = Number(splitAssignQty) || 0;
    
    // Validate main quantity
    if (!quickAssignQty) {
      errors.quickAssignQty = 'Quantity is required';
    } else if (mainQty <= 0) {
      errors.quickAssignQty = 'Quantity must be greater than 0';
    } else if (mainQty > maxQty) {
      errors.quickAssignQty = `Quantity cannot exceed available quantity (${maxQty})`;
    }
    
    // Validate split quantities if split order is enabled
    if (splitOrder) {
      if (!splitAssignStep) {
        errors.splitAssignStep = 'Split assignment step is required';
      }
      
      if (!splitAssignQty) {
        errors.splitAssignQty = 'Split quantity is required';
      } else if (splitQty <= 0) {
        errors.splitAssignQty = 'Split quantity must be greater than 0';
      }
      
      // Validation Rule 1: Cannot assign to same engineer
      if (quickAssignStep && splitAssignStep && quickAssignStep === splitAssignStep) {
        errors.sameEngineer = 'Cannot split order to the same engineer. Please select different workflow steps.';
      }
      
      // Validation Rule 2: Split must exhaust total quantity exactly
      const totalQty = mainQty + splitQty;
      if (totalQty !== maxQty && quickAssignQty && splitAssignQty) {
        errors.totalQtyMismatch = `Split quantities must add up to exactly ${maxQty}. Current total: ${totalQty}`;
      }
      
      // Check total quantities don't exceed available (redundant but keeping for safety)
      if (totalQty > maxQty) {
        errors.totalQty = `Total quantity (${totalQty}) exceeds available quantity (${maxQty})`;
      }
    }
    
    setQuickAssignErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuickAssignSave = () => {
    if (quickAssignStep && validateQuickAssign()) {
      const assignmentData = {
        orderId: selectedOrder?.id,
        step: quickAssignStep,
        qty: quickAssignQty
      };
      
      if (splitOrder) {
        assignmentData.splitStep = splitAssignStep;
        assignmentData.splitQty = splitAssignQty;
      }
      
      console.log('Quick assign saved:', assignmentData);
      setQuickAssignOpen(false);
      setQuickAssignStep('');
      setQuickAssignQty('');
      setSplitOrder(false);
      setSplitAssignStep('');
      setSplitAssignQty('');
      setQuickAssignErrors({});
    }
  };

  const handleQuickAssignCancel = () => {
    setQuickAssignOpen(false);
    setQuickAssignStep('');
    setQuickAssignQty('');
    setSplitOrder(false);
    setSplitAssignStep('');
    setSplitAssignQty('');
    setQuickAssignErrors({});
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-gray-900 mb-2">Material Issue</h1>
            <p className="text-gray-600">Track and manage assembly line orders and manufacturing workflow</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Unique Code, GMSOA NO., or Party..."
                value={effectiveSearchTerm}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setLocalSearchTerm(e.target.value);
                  }
                }}
                className="pl-10 w-full sm:w-80 bg-white/80 backdrop-blur-sm border-gray-200/60 relative z-0"
              />
            </div>
            
            {/* Print Button */}
            <Button 
              onClick={handleShowBinCard}
              variant="outline"
              disabled={selectedRows.size === 0}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200/60 hover:bg-blue-50 hover:border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="h-4 w-4" />
              Print Bin Card
            </Button>

            {/* Urgent Project Button */}
            <Button 
              onClick={() => setShowUrgentOnly(!showUrgentOnly)}
              className={`flex items-center gap-2 transition-colors ${
                showUrgentOnly 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                  : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
              }`}
            >
              <Siren className="h-4 w-4" />
              {showUrgentOnly ? 'Show All Projects' : 'Urgent Projects Only'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <OrderFilters
            assemblyLineFilter={assemblyLineFilter}
            setAssemblyLineFilter={setAssemblyLineFilter}
            dateFilterMode={dateFilterMode}
            setDateFilterMode={setDateFilterMode}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            assemblyLines={assemblyLines}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Search Results Summary */}
        {effectiveSearchTerm && (
          <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/60">
            <p className="text-sm text-blue-700">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found for "{effectiveSearchTerm}"
              {filteredOrders.length === 0 && (
                <span className="ml-2 text-blue-600">
                  - Try searching by Unique Code, GMSOA NO., or Party Name.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div 
          ref={tableScrollRef}
          className="relative overflow-x-auto max-w-full"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 z-20 bg-white px-3 py-2 text-center border-r border-gray-200 w-12">
                    <Checkbox
                      checked={allRowsSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all rows"
                    />
                  </th>
                  <th className="sticky left-12 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-32">Assembly Line</th>
                  <th className="sticky left-44 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-28">GMSOA NO.</th>
                  <th className="sticky left-72 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-24">SOA Sr. No.</th>
                  <th className="sticky left-96 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Assembly Date</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-36">Unique Code</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Splitted Code</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Party</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Customer PO No.</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Code No</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-80">Product</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty Exe.</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Qty Pending</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">finished valve</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">GM LOGO</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">NAME PLATE</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PRODUCT SPCL1</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PRODUCT SPCL2</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ width: '400px' }}>PRODUCT SPCL3</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">INSPECTION</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">PAINTING</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">remarks</th>
                  <th className="sticky right-0 z-20 bg-white px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="group hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 text-center border-r border-gray-200 w-12">
                      <Checkbox
                        checked={selectedRows.has(order.id)}
                        onCheckedChange={() => toggleRowSelection(order.id)}
                        aria-label={`Select row ${order.id}`}
                      />
                    </td>
                    <td className="sticky left-12 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 min-w-32">
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
                        {order.assemblyLine}
                      </Badge>
                    </td>
                    <td className="sticky left-44 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-28">{order.gmsoaNo}</td>
                    <td className="sticky left-72 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r border-gray-200 min-w-24">{order.soaSrNo}</td>
                    <td className="sticky left-96 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 border-r-2 border-gray-300 min-w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{order.assemblyDate}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 font-mono min-w-36">{order.uniqueCode}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.splittedCode}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900 max-w-xs truncate">{order.party}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.customerPoNo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.codeNo}</td>
                    <td className="px-3 py-2 text-center text-sm text-gray-900 w-80">
                      <div className="line-clamp-2">{order.product}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.qty}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.qtyExe}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.qtyPending}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.finishedValve}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.gmLogo}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.namePlate}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.productSpcl1}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.productSpcl2}</td>
                    <td className="px-3 py-2 text-center text-sm text-gray-900" style={{ width: '400px' }}>
                      <div className="line-clamp-2">{order.productSpcl3}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.inspection}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.painting}</td>
                    <td className="px-3 py-2 text-center text-sm text-gray-900">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 w-7 p-0 ${
                          getRemark(order.id) 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'hover:bg-blue-100'
                        }`}
                        title="Add/Edit Remarks"
                        onClick={() => handleOpenRemarks(order)}
                      >
                        <MessageSquarePlus className={`h-4 w-4 ${
                          getRemark(order.id) ? 'text-white' : 'text-blue-600'
                        }`} />
                      </Button>
                    </td>
                    
                    {/* Sticky Right Column - Actions */}
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap border-l border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 hover:bg-blue-100" 
                          title="View Details"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 hover:bg-green-100" 
                          title="Assign Next"
                          onClick={() => handleQuickAssign(order)}
                        >
                          <ArrowRight className="h-4 w-4 text-green-600" />
                        </Button>

                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={`h-7 w-7 p-0 transition-all duration-200 ${
                            getAlertStatus(order.id) 
                              ? 'bg-red-100 hover:bg-red-200 shadow-sm border border-red-200' 
                              : 'hover:bg-red-50'
                          }`}
                          title={getAlertStatus(order.id) ? "Alert ON - Click to turn OFF" : "Alert OFF - Click to turn ON"}
                          onClick={() => toggleAlertStatus(order.id)}
                        >
                          <Siren className={`h-4 w-4 ${
                            getAlertStatus(order.id) 
                              ? 'text-red-600 animate-siren-pulse' 
                              : 'text-gray-400'
                          }`} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Assign Dialog */}
      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Assign Order</DialogTitle>
            <DialogDescription>
              Assign {selectedOrder?.uniqueCode} to the next workflow step
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Main Assignment Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignStep">Assign to Workflow Step</Label>
                  <Select value={quickAssignStep} onValueChange={setQuickAssignStep}>
                    <SelectTrigger id="assignStep">
                      <SelectValue placeholder="Select step" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semi-qc">Semi QC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assignQty">Quantity</Label>
                  <Input 
                    id="assignQty" 
                    type="number" 
                    value={quickAssignQty}
                    onChange={(e) => {
                      setQuickAssignQty(e.target.value);
                      if (quickAssignErrors.quickAssignQty) {
                        setQuickAssignErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.quickAssignQty;
                          delete newErrors.totalQtyMismatch;
                          delete newErrors.totalQty;
                          return newErrors;
                        });
                      }
                    }}
                    max={selectedOrder?.qtyPending}
                    className={quickAssignErrors.quickAssignQty ? 'border-red-500' : ''}
                  />
                  {quickAssignErrors.quickAssignQty && (
                    <p className="text-sm text-red-500">{quickAssignErrors.quickAssignQty}</p>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Available Quantity: <span className="font-medium text-gray-900">{selectedOrder?.qtyPending}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleQuickAssignCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleQuickAssignSave} 
              className="bg-black hover:bg-gray-800"
              disabled={!quickAssignStep || !quickAssignQty || (splitOrder && (!splitAssignStep || !splitAssignQty))}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bin Card Dialog */}
      <Dialog open={binCardDialogOpen} onOpenChange={setBinCardDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bin Card - Selected Orders</DialogTitle>
            <DialogDescription>
              Review selected orders and print bin card
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedOrdersData.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-6 space-y-4 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Date</Label>
                    <p className="text-gray-900 mt-1">{order.assemblyDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GMSOA No - SR. NO.</Label>
                    <p className="text-gray-900 mt-1">
                      {order.gmsoaNo.replace('SOA', '')} - {order.soaSrNo}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-sm">Item Description</Label>
                  <p className="text-gray-900 mt-1">{order.product}</p>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-sm">QTY</Label>
                  <p className="text-gray-900 mt-1">{order.qty}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setBinCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePrintBinCard}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Order Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for {viewedOrder?.uniqueCode}
            </DialogDescription>
          </DialogHeader>
          
          {viewedOrder && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="bg-blue-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Line</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.assemblyLine}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GMSOA No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.gmsoaNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">SOA Sr. No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.soaSrNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Assembly Date</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.assemblyDate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Unique Code</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.uniqueCode}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Splitted Code</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.splittedCode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Customer & Product Information */}
              <div className="bg-green-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Customer & Product Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Party</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.party}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Customer PO No.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.customerPoNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Code No</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.codeNo}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Product</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.product}</p>
                  </div>
                </div>
              </div>

              {/* Quantity Information */}
              <div className="bg-purple-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Quantity Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Qty</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.qty}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Qty Exe.</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.qtyExe}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Qty Pending</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.qtyPending}</p>
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="bg-amber-50/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Product Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Finished Valve</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.finishedValve}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">GM Logo</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.gmLogo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Name Plate</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.namePlate}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Product SPCL1</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl1 || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Product SPCL2</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl2 || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Product SPCL3</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.productSpcl3 || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-sm">Inspection</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.inspection}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-sm">Painting</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.painting}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500 text-sm">Remarks</Label>
                    <p className="text-gray-900 mt-1">{viewedOrder.remarks || 'No remarks'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setViewDetailsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Remarks Dialog */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add/Edit Remarks</DialogTitle>
            <DialogDescription>
              {remarksOrder && `Order: ${remarksOrder.uniqueCode}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Enter remarks for this order..."
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setRemarksDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveRemarks}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Remarks
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

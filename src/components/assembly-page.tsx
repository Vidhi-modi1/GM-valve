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
    splittedCode: 'ORD-0776-2025-3-M1',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 36,
    qtyExe: 10,
    qtyPending: 26,
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
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '3',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-3',
    splittedCode: 'ORD-0776-2025-3-M2',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GT8AH12T80C8H1G29',
    product: '20MM-GTV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 26,
    qtyExe: 10,
    qtyPending: 16,
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
    splittedCode: 'ORD-0776-2025-7-M1',
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
    splittedCode: 'ORD-0918-2025-3-M1',
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

export function AssemblyPage({ searchTerm = '', onSearchChange, onNavigateToOrders, showAddOrderModal = false, setShowAddOrderModal }: OrdersPageProps) {

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrderData | null>(null);
  const [alertStatuses, setAlertStatuses] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [viewedOrder, setViewedOrder] = useState<AssemblyOrderData | null>(null);
  const [remarksDialogOpen, setRemarksDialogOpen] = useState(false);
  const [remarksOrder, setRemarksOrder] = useState<AssemblyOrderData | null>(null);
  const [remarksText, setRemarksText] = useState('');
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  
  // Ref for table scrolling
  const tableScrollRef = useRef<HTMLDivElement>(null);
  
  // Quick assign state
  const [quickAssignStep, setQuickAssignStep] = useState('assembly');
  const [quickAssignQty, setQuickAssignQty] = useState('');
  const [quickAssignErrors, setQuickAssignErrors] = useState<{[key: string]: string}>({});

  // Use localSearchTerm if onSearchChange is not provided
  const effectiveSearchTerm = onSearchChange ? searchTerm : localSearchTerm;

  // Filter orders based on search term and urgent filter (memoized for performance)
  const filteredOrders = useMemo(() => {
    let orders = mockAssemblyOrders;
    
    // Filter by urgent/alert status if enabled
    if (showUrgentOnly) {
      orders = orders.filter(order => alertStatuses[order.id] === true);
    }
    
    // Filter by search term
    if (!effectiveSearchTerm.trim()) return orders;
    
    const lowerSearchTerm = effectiveSearchTerm.toLowerCase();
    return orders.filter(order =>
      order.uniqueCode.toLowerCase().includes(lowerSearchTerm) ||
      order.party.toLowerCase().includes(lowerSearchTerm) ||
      order.gmsoaNo.toLowerCase().includes(lowerSearchTerm)
    );
  }, [effectiveSearchTerm, showUrgentOnly, alertStatuses]);

  // Toggle alert status
  const toggleAlertStatus = (orderId: string) => {
    setAlertStatuses(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
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
    setRemarksText(order.remarks || '');
    setRemarksDialogOpen(true);
  };

  // Save remarks
  const handleSaveRemarks = () => {
    if (remarksOrder) {
      // Update the remarks in the order
      const orderIndex = mockAssemblyOrders.findIndex(o => o.id === remarksOrder.id);
      if (orderIndex !== -1) {
        mockAssemblyOrders[orderIndex].remarks = remarksText;
      }
      setRemarksDialogOpen(false);
      setRemarksOrder(null);
      setRemarksText('');
    }
  };

  // Quick assign handlers
  const handleQuickAssign = (order: AssemblyOrderData) => {
    setSelectedOrder(order);
    // Set testing step based on Assembly Line value
    const testingStep = ['A', 'B', 'C'].includes(order.assemblyLine) ? 'testing-1' : 'testing-2';
    setQuickAssignStep(testingStep);
    setQuickAssignQty(order.qtyPending.toString());
    setQuickAssignErrors({});
    setQuickAssignOpen(true);
  };

  const validateQuickAssign = () => {
    const errors: {[key: string]: string} = {};
    const maxQty = selectedOrder?.qtyPending || 0;
    const mainQty = Number(quickAssignQty) || 0;
    
    // Validate main quantity
    if (!quickAssignQty) {
      errors.quickAssignQty = 'Quantity is required';
    } else if (mainQty <= 0) {
      errors.quickAssignQty = 'Quantity must be greater than 0';
    } else if (mainQty > maxQty) {
      errors.quickAssignQty = `Quantity cannot exceed available quantity (${maxQty})`;
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
      
      console.log('Quick assign saved:', assignmentData);
      setQuickAssignOpen(false);
      setQuickAssignStep('');
      setQuickAssignQty('');
      setQuickAssignErrors({});
    }
  };

  const handleQuickAssignCancel = () => {
    setQuickAssignOpen(false);
    setQuickAssignStep('');
    setQuickAssignQty('');
    setQuickAssignErrors({});
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-gray-900 mb-2">Assembly</h1>
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
                          order.remarks 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'hover:bg-blue-100'
                        }`}
                        title="Add/Edit Remarks"
                        onClick={() => handleOpenRemarks(order)}
                      >
                        <MessageSquarePlus className={`h-4 w-4 ${
                          order.remarks ? 'text-white' : 'text-blue-600'
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
                            alertStatuses[order.id] 
                              ? 'bg-red-100 hover:bg-red-200 shadow-sm border border-red-200' 
                              : 'hover:bg-red-50'
                          }`}
                          title={alertStatuses[order.id] ? "Alert ON - Click to turn OFF" : "Alert OFF - Click to turn ON"}
                          onClick={() => toggleAlertStatus(order.id)}
                        >
                          <Siren className={`h-4 w-4 ${
                            alertStatuses[order.id] 
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Assign</DialogTitle>
            <DialogDescription>
              Quickly assign order {selectedOrder?.uniqueCode} to the next workflow step.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Main Assignment Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignStep">Assign to Workflow Step</Label>
                  <Select value={quickAssignStep} onValueChange={setQuickAssignStep} disabled>
                    <SelectTrigger id="assignStep" className="font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing-1">Testing - 1</SelectItem>
                      <SelectItem value="testing-2">Testing - 2</SelectItem>
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

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleQuickAssignCancel}>Cancel</Button>
            <Button onClick={handleQuickAssignSave}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for order {viewedOrder?.uniqueCode}
            </DialogDescription>
          </DialogHeader>
          
          {viewedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Assembly Line</Label>
                  <p className="text-sm font-medium">{viewedOrder.assemblyLine}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GMSOA NO.</Label>
                  <p className="text-sm font-medium">{viewedOrder.gmsoaNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SOA Sr. No.</Label>
                  <p className="text-sm font-medium">{viewedOrder.soaSrNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Assembly Date</Label>
                  <p className="text-sm font-medium">{viewedOrder.assemblyDate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Unique Code</Label>
                  <p className="text-sm font-medium font-mono">{viewedOrder.uniqueCode}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Splitted Code</Label>
                  <p className="text-sm font-medium">{viewedOrder.splittedCode || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Party</Label>
                  <p className="text-sm font-medium">{viewedOrder.party}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Customer PO No.</Label>
                  <p className="text-sm font-medium">{viewedOrder.customerPoNo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Code No</Label>
                  <p className="text-sm font-medium">{viewedOrder.codeNo}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Product</Label>
                  <p className="text-sm font-medium">{viewedOrder.product}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Quantity</Label>
                  <p className="text-sm font-medium">{viewedOrder.qty}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Qty Executed</Label>
                  <p className="text-sm font-medium">{viewedOrder.qtyExe}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Qty Pending</Label>
                  <p className="text-sm font-medium">{viewedOrder.qtyPending}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Finished Valve</Label>
                  <p className="text-sm font-medium">{viewedOrder.finishedValve || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GM Logo</Label>
                  <p className="text-sm font-medium">{viewedOrder.gmLogo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Name Plate</Label>
                  <p className="text-sm font-medium">{viewedOrder.namePlate}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Product SPCL1</Label>
                  <p className="text-sm font-medium">{viewedOrder.productSpcl1}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Product SPCL2</Label>
                  <p className="text-sm font-medium">{viewedOrder.productSpcl2}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Product SPCL3</Label>
                  <p className="text-sm font-medium">{viewedOrder.productSpcl3 || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Inspection</Label>
                  <p className="text-sm font-medium">{viewedOrder.inspection}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Painting</Label>
                  <p className="text-sm font-medium">{viewedOrder.painting}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Remarks</Label>
                  <p className="text-sm font-medium">{viewedOrder.remarks || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remarks Dialog */}
      <Dialog open={remarksDialogOpen} onOpenChange={setRemarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Remarks</DialogTitle>
            <DialogDescription>
              Add or edit remarks for order {remarksOrder?.uniqueCode}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                placeholder="Enter remarks..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setRemarksDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRemarks}>Save Remarks</Button>
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
    </div>
  );
}

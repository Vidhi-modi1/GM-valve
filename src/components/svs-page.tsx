import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, CalendarIcon, Printer, Search, ArrowRight, Siren, Eye } from 'lucide-react';
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
    id: '0',
    assemblyLine: 'S',
    gmsoaNo: 'SOA0210',
    soaSrNo: '25',
    assemblyDate: '27-10-2025',
    uniqueCode: 'ORD-0210-2025-25',
    splittedCode: '',
    party: 'Independence Valve & Supply',
    customerPoNo: '1030755',
    codeNo: '32GT1D9T12C3H6P3',
    product: '32MM-GTV-150#-F316/L(SS316/L)-INTFE-T12(SS316+HST6)-B8M/8M-H304/L-PTEADIT',
    qty: 20,
    qtyExe: 0,
    qtyPending: 20,
    finishedValve: 'yes',
    gmLogo: 'PVP',
    namePlate: 'PVP',
    productSpcl1: 'એરોનું ટપકું કાઢવું.',
    productSpcl2: 'WEDGE ST.6',
    productSpcl3: '',
    inspection: 'Y',
    painting: 'N',
    remarks: '',
    alertStatus: false
  },
  {
    id: '2',
    assemblyLine: 'A',
    gmsoaNo: 'SOA0776',
    soaSrNo: '5',
    assemblyDate: '20-09-2025',
    uniqueCode: 'ORD-0776-2025-5',
    splittedCode: '',
    party: 'coxBRO Engineering Pvt Ltd',
    customerPoNo: '56420',
    codeNo: '20GB8AH12T80C8H1G29',
    product: '20MM-GBV-800#-F60-BW80-T80(F60+FST6)-B8MCL2/8M-HREG-F60+GRAPHITE',
    qty: 4,
    qtyExe: 0,
    qtyPending: 4,
    finishedValve: 'yes',
    gmLogo: 'BOS',
    namePlate: 'N',
    productSpcl1: '',
    productSpcl2: 'PLUG ST.6',
    productSpcl3: 'T',
    inspection: 'N',
    painting: 'N',
    remarks: '',
    alertStatus: false
  },
  {
    id: '4',
    assemblyLine: 'D',
    gmsoaNo: 'SOA0918',
    soaSrNo: '1',
    assemblyDate: 'HOLD',
    uniqueCode: 'ORD-0918-2025-1',
    splittedCode: '',
    party: 'John Crane Middle East F.Z.E.',
    customerPoNo: '4503254953',
    codeNo: 'OTB20GT9D13T12WBH2S3(0918)',
    product: 'OTB-20MM-GTV-1500#-F316/L(SS316/L)-BW160-T12(SS316+HST6)-WELDED-HBLK-FULL BORE-(0918)',
    qty: 11,
    qtyExe: 0,
    qtyPending: 11,
    finishedValve: 'yes',
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

interface SvsPageProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onNavigateToOrders?: () => void;
  showAddOrderModal?: boolean;
  setShowAddOrderModal?: (show: boolean) => void;
}

export function SvsPage({ searchTerm = '', onSearchChange, onNavigateToOrders, showAddOrderModal = false, setShowAddOrderModal }: SvsPageProps) {

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [binCardDialogOpen, setBinCardDialogOpen] = useState(false);
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AssemblyOrderData | null>(null);
  const [assignQuantity, setAssignQuantity] = useState<string>('');
  const [quantityError, setQuantityError] = useState<string>('');
  const [alertStatuses, setAlertStatuses] = useState<Record<string, boolean>>({});
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);
  
  // Ref for table scrolling
  const tableScrollRef = useRef<HTMLDivElement>(null);

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

  // Handle quick assign
  const handleQuickAssign = (order: AssemblyOrderData) => {
    setSelectedOrder(order);
    setAssignQuantity(order.qtyPending.toString());
    setQuantityError('');
    setQuickAssignOpen(true);
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
        pdf.text('SVS Report', 20, 20);
        
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
        const fileName = `SVS_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-gray-900 mb-2">SVS</h1>
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
                    <td className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-900">{order.remarks}</td>
                    <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2 whitespace-nowrap border-l border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 hover:bg-blue-100" 
                          title="View Details"
                          onClick={() => {}}
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

      {/* Quick Assign Dialog */}
      <Dialog open={quickAssignOpen} onOpenChange={setQuickAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Assign</DialogTitle>
            <DialogDescription>
              Quickly assign order {selectedOrder?.uniqueCode} to next workflow step.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Next Step */}
            <div>
              <Label htmlFor="nextStep">Move To Next Step</Label>
              <Input
                id="nextStep"
                value="Marking - 1"
                disabled
                className="bg-gray-50 text-gray-900 font-bold"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={assignQuantity}
                disabled
                placeholder="Enter quantity"
                className="bg-gray-50 text-gray-900 font-bold"
              />
              {quantityError && (
                <p className="text-red-500 text-sm mt-1">{quantityError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setQuickAssignOpen(false);
              setAssignQuantity('');
              setQuantityError('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setQuickAssignOpen(false);
                setAssignQuantity('');
                setQuantityError('');
              }}
              disabled={!!quantityError || !assignQuantity}
            >
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { CalendarIcon, Printer, Search, CheckCircle, Clock, AlertCircle, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import {
  planningOrders,
  materialIssueOrders,
  semiQcOrders,
  afterPhosphatingQcOrders,
  assemblyOrders,
  testingOrders,
  svsOrders,
  markingOrders,
  OrderData,
  WorkflowTimestamp
} from './shared-order-data';

// Unified order interface for search results
interface SearchOrderResult {
  id: string;
  orderId: string;
  party: string;
  product: string;
  currentLocation: string; // Which menu/workflow step
  status: string;
  qty: number;
  qtyExe: number;
  qtyPending: number;
  date: string;
  assemblyLine?: string;
  gmsoaNo?: string;
  customerPoNo?: string;
  codeNo?: string;
  workflowHistory?: WorkflowTimestamp[];
}

// Helper function to determine status based on quantities
const getOrderStatus = (qtyExe: number, qtyPending: number): string => {
  if (qtyPending === 0) return 'Completed';
  if (qtyExe > 0) return 'In Progress';
  return 'Pending';
};

// Helper function to convert date format
const convertDateFormat = (dateStr: string): string => {
  // Convert from DD-MM-YYYY to YYYY-MM-DD for proper Date parsing
  if (dateStr === 'HOLD') return new Date().toISOString().split('T')[0];
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

// Helper function to convert OrderData to SearchOrderResult
const convertToSearchResult = (order: OrderData, location: string): SearchOrderResult => {
  return {
    id: `${location.toLowerCase().replace(/\s+/g, '-')}-${order.id}`,
    orderId: order.uniqueCode,
    party: order.party,
    product: order.product,
    currentLocation: location,
    status: getOrderStatus(order.qtyExe, order.qtyPending),
    qty: order.qty,
    qtyExe: order.qtyExe,
    qtyPending: order.qtyPending,
    date: convertDateFormat(order.assemblyDate),
    assemblyLine: order.assemblyLine,
    gmsoaNo: order.gmsoaNo,
    customerPoNo: order.customerPoNo,
    codeNo: order.codeNo,
    workflowHistory: order.workflowHistory
  };
};

// Compile all orders from all workflow stages
const allOrders: SearchOrderResult[] = [
  ...planningOrders.map(order => convertToSearchResult(order, 'Planning')),
  ...materialIssueOrders.map(order => convertToSearchResult(order, 'Material Issue')),
  ...semiQcOrders.map(order => convertToSearchResult(order, 'Semi QC')),
  ...afterPhosphatingQcOrders.map(order => convertToSearchResult(order, 'After Phosphating QC')),
  ...assemblyOrders.map(order => convertToSearchResult(order, 'Assembly')),
  ...testingOrders.map(order => convertToSearchResult(order, 'Testing')),
  ...svsOrders.map(order => convertToSearchResult(order, 'SVS')),
  ...markingOrders.map(order => convertToSearchResult(order, 'Marking'))
];

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'in progress':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'in progress':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getLocationColor = (location: string): string => {
  const colors: Record<string, string> = {
    'Planning': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    'Material Issue': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    'Semi QC': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
    'After Phosphating QC': 'bg-teal-100 text-teal-800 hover:bg-teal-100',
    'Assembly': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
    'Testing': 'bg-pink-100 text-pink-800 hover:bg-pink-100',
    'SVS': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
    'Marking': 'bg-violet-100 text-violet-800 hover:bg-violet-100'
  };
  return colors[location] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
};

export function AssignedOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<SearchOrderResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (!searchQuery.trim() && !fromDate && !toDate) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    const results = allOrders.filter(order => {
      // Text search
      const matchesSearch = !searchQuery.trim() || 
        order.orderId.toLowerCase().includes(lowerQuery) ||
        order.party.toLowerCase().includes(lowerQuery) ||
        order.product.toLowerCase().includes(lowerQuery) ||
        order.currentLocation.toLowerCase().includes(lowerQuery) ||
        order.status.toLowerCase().includes(lowerQuery) ||
        (order.gmsoaNo && order.gmsoaNo.toLowerCase().includes(lowerQuery)) ||
        (order.assemblyLine && order.assemblyLine.toLowerCase().includes(lowerQuery)) ||
        (order.customerPoNo && order.customerPoNo.toLowerCase().includes(lowerQuery)) ||
        (order.codeNo && order.codeNo.toLowerCase().includes(lowerQuery));

      // Date filter
      const orderDate = new Date(order.date);
      const matchesFromDate = !fromDate || orderDate >= fromDate;
      const matchesToDate = !toDate || orderDate <= toDate;

      return matchesSearch && matchesFromDate && matchesToDate;
    });

    setSearchResults(results);
    setHasSearched(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
        pdf.setTextColor(31, 41, 55);
        pdf.text('Search Orders Report', 20, 20);
        
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text('Search and filter orders by criteria and date range', 20, 28);
        
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        pdf.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 36);
        
        // Search criteria
        let yPos = 50;
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Search Criteria:', 20, yPos);
        yPos += 8;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        if (searchQuery) {
          pdf.text(`Search Term: ${searchQuery}`, 20, yPos);
          yPos += 6;
        }
        
        if (fromDate) {
          pdf.text(`From Date: ${fromDate.toLocaleDateString()}`, 20, yPos);
          yPos += 6;
        }
        
        if (toDate) {
          pdf.text(`To Date: ${toDate.toLocaleDateString()}`, 20, yPos);
          yPos += 6;
        }
        
        yPos += 5;
        pdf.setFont(undefined, 'bold');
        pdf.text(`Results Found: ${searchResults.length}`, 20, yPos);
        yPos += 10;
        
        // Table headers
        const lineHeight = 7;
        const columnWidths = [35, 40, 30, 35, 20, 15, 15, 20];
        const startX = 10;
        
        // Draw table header
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'bold');
        
        const headers = ['Order ID', 'Party', 'Current Location', 'Product', 'Status', 'Qty', 'Executed', 'Pending'];
        let xPos = startX;
        
        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPos);
          xPos += columnWidths[index];
        });
        
        yPos += lineHeight;
        pdf.line(startX, yPos - 1, startX + columnWidths.reduce((a, b) => a + b, 0), yPos - 1);
        
        // Add table data
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(7);
        
        searchResults.forEach((order) => {
          if (yPos > 190) {
            pdf.addPage();
            yPos = 20;
            
            // Redraw header
            pdf.setFont(undefined, 'bold');
            pdf.setFontSize(8);
            let xPosHeader = startX;
            headers.forEach((header, headerIndex) => {
              pdf.text(header, xPosHeader, yPos);
              xPosHeader += columnWidths[headerIndex];
            });
            yPos += lineHeight;
            pdf.line(startX, yPos - 1, startX + columnWidths.reduce((a, b) => a + b, 0), yPos - 1);
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(7);
          }
          
          xPos = startX;
          const rowData = [
            order.orderId,
            order.party,
            order.currentLocation,
            order.product,
            order.status,
            order.qty.toString(),
            order.qtyExe.toString(),
            order.qtyPending.toString()
          ];
          
          rowData.forEach((data, dataIndex) => {
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
        
        // Add footer
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(107, 114, 128);
          pdf.text(
            `Total Orders: ${searchResults.length} | Page ${i} of ${pageCount}`,
            20,
            pdf.internal.pageSize.height - 10
          );
        }
        
        // Save the PDF
        const fileName = `Search_Orders_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp.replace(' ', 'T'));
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (enteredAt: string, exitedAt?: string) => {
    const start = new Date(enteredAt.replace(' ', 'T'));
    const end = exitedAt ? new Date(exitedAt.replace(' ', 'T')) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      const hrs = diffHrs % 24;
      return `${days}d ${hrs}h`;
    }
    return `${diffHrs}h ${diffMins}m`;
  };

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in bg-white min-h-screen">
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div>
            <h1 className="text-gray-900 mb-2">Search Orders</h1>
            <p className="text-gray-600">Search and track orders across all workflow stages</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div>
            <Label htmlFor="search" className="text-gray-700 mb-2">Search Orders</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by Order ID, Party Name, Product, Location, Status, GMSOA No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 w-full bg-white/80 backdrop-blur-sm border-gray-200/60"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter to search</p>
          </div>

          {/* Date Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fromDate" className="text-gray-700 mb-2">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="fromDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-gray-200/60"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? formatDate(fromDate) : <span className="text-gray-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="toDate" className="text-gray-700 mb-2">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="toDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-gray-200/60"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? formatDate(toDate) : <span className="text-gray-400">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleSearch}
              className="bg-[#174a9f] hover:bg-[#123a7f] text-white flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search Orders
            </Button>

            {hasSearched && searchResults.length > 0 && (
              <Button 
                onClick={handlePrint}
                variant="outline"
                className="flex items-center gap-2 border-gray-200 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" />
                Print Results
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setFromDate(undefined);
                setToDate(undefined);
                setSearchResults([]);
                setHasSearched(false);
              }}
              className="border-gray-200 hover:bg-gray-50"
            >
              Clear All
            </Button>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || fromDate || toDate) && (
            <div className="mt-4 p-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/60">
              <p className="text-sm text-blue-700 font-medium mb-2">Active Filters:</p>
              <div className="space-y-1">
                {searchQuery && (
                  <p className="text-sm text-blue-600">
                    • Search: "{searchQuery}"
                  </p>
                )}
                {fromDate && (
                  <p className="text-sm text-blue-600">
                    • From: {formatDate(fromDate)}
                  </p>
                )}
                {toDate && (
                  <p className="text-sm text-blue-600">
                    • To: {formatDate(toDate)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900">Search Results</h2>
            <p className="text-gray-600 text-sm mt-1">
              Found {searchResults.length} {searchResults.length === 1 ? 'order' : 'orders'} across all workflow stages
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assembly Line</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GMSOA No</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {searchResults.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {order.workflowHistory && order.workflowHistory.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRow(order.id)}
                            >
                              {expandedRows.has(order.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 font-mono">
                          {order.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.party}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getLocationColor(order.currentLocation)}>
                            {order.currentLocation}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          <div className="line-clamp-2">{order.product}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span>{order.status}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {order.qtyExe}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                          {order.qtyPending}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Badge variant="outline" className="bg-gray-50">
                            {order.assemblyLine || '-'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.gmsoaNo || '-'}
                        </td>
                      </tr>
                      {expandedRows.has(order.id) && order.workflowHistory && (
                        <tr className="bg-gray-50">
                          <td colSpan={12} className="px-6 py-6">
                            <div className="flex items-start space-x-3 mb-3">
                              <History className="h-5 w-5 text-blue-600 mt-0.5" />
                              <h4 className="font-medium text-gray-900">Workflow Timeline</h4>
                            </div>
                            <div className="ml-8 space-y-4">
                              {order.workflowHistory.map((history, index) => (
                                <div key={index} className="relative pl-6 pb-4 border-l-2 border-blue-200 last:border-l-0 last:pb-0">
                                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
                                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge className={getLocationColor(history.stage)}>
                                        {history.stage}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {history.exitedAt ? (
                                          <>Duration: {calculateDuration(history.enteredAt, history.exitedAt)}</>
                                        ) : (
                                          <>Current Stage - {calculateDuration(history.enteredAt)}</>
                                        )}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                      <div>
                                        <span className="text-gray-500">Entered:</span>
                                        <p className="text-gray-900 font-medium">{formatTimestamp(history.enteredAt)}</p>
                                      </div>
                                      {history.exitedAt && (
                                        <div>
                                          <span className="text-gray-500">Exited:</span>
                                          <p className="text-gray-900 font-medium">{formatTimestamp(history.exitedAt)}</p>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-gray-500">Qty Processed:</span>
                                        <p className="text-green-600 font-medium">{history.qtyProcessed}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 text-sm">
                Try adjusting your search criteria or date range
              </p>
            </div>
          )}
        </div>
      )}

      {/* Information Section */}
      {!hasSearched && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-gray-900 mb-2">How to Use Search Orders</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Enter search terms to find orders by Order ID, Party Name, Product, Current Location, Status, or GMSOA Number</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Filter orders by date range using the From Date and To Date selectors</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Press Enter or click "Search Orders" to view results from all workflow stages</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>View which workflow stage each order is currently in (Planning, Material Issue, Assembly, Testing, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Status is automatically calculated: Pending (not started), In Progress (partially completed), or Completed (fully finished)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Click "Print Results" to generate a PDF report of your search results</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

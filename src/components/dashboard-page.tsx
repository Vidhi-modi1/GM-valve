import React, { useState } from 'react';
import { Plus, Package, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { DashboardHeader } from './dashboard-header';
import { ModernStatCard } from './modern-stat-card';
import { OrdersPage } from './orders-page';
import { OrdersPage2 } from './orders-page-2';
import { SvsPage } from './svs-page';
import { SemiQcPage } from './semi-qc-page';
import { AfterPhosphatingQcPage } from './after-phosphating-qc-page';
import { TestingPage } from './testing-page';
import { MarkingPage } from './marking-page';
import { AssemblyPage } from './assembly-page';
import { AssignedOrdersPage } from './assigned-orders-page';
import { AddOrderModal } from './add-order-modal';

interface DashboardPageProps {
  onLogout: () => void;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  
  // State for Excel functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [excelData, setExcelData] = useState<any[]>([]);
  
  // Add Order Modal state
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  // Excel functionality handlers
  const handleBrowseExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFileName(file.name);
        // Mock data for demo
        setExcelData([
          { id: 1, name: 'Sample Order 1', status: 'Pending' },
          { id: 2, name: 'Sample Order 2', status: 'In Progress' }
        ]);
      }
    };
    input.click();
  };

  const handleViewData = () => {
    console.log('View data:', excelData);
    // This would typically open a modal with the data
  };

  const handlePrintReport = () => {
    window.print();
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'Orders':
        return <OrdersPage 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          showAddOrderModal={showAddOrderModal}
          setShowAddOrderModal={setShowAddOrderModal}
        />;
      case 'Orders2':
        return <OrdersPage2 />;
      case 'SVS':
        return <SvsPage />;
      case 'SemiQC':
        return <SemiQcPage />;
      case 'AfterPhosphatingQC':
        return <AfterPhosphatingQcPage />;
      case 'Assembly':
        return <AssemblyPage />;
      case 'Testing':
        return <TestingPage />;
      case 'Marking':
        return <MarkingPage />;
      case 'AssignedOrders':
        return <AssignedOrdersPage />;
      case 'Dashboard':
      default:
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
            {/* Modern Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <ModernStatCard
                title="Total Orders"
                value="127"
                change={{ value: "+12%", positive: true }}
                icon={Package}
                gradient="blue"
                trend={[30, 45, 35, 60, 55, 70, 65, 80]}
              />
              
              <ModernStatCard
                title="In Progress"
                value="42"
                change={{ value: "+8%", positive: true }}
                icon={Clock}
                gradient="orange"
                trend={[40, 30, 50, 45, 60, 55, 70, 65]}
              />
              
              <ModernStatCard
                title="Completed"
                value="85"
                change={{ value: "+15%", positive: true }}
                icon={CheckCircle2}
                gradient="green"
                trend={[20, 35, 30, 50, 45, 65, 60, 80]}
              />
              
              <ModernStatCard
                title="Efficiency"
                value="94%"
                change={{ value: "+5%", positive: true }}
                icon={TrendingUp}
                gradient="purple"
                trend={[50, 55, 60, 65, 70, 75, 80, 85]}
              />
            </div>

            {/* Welcome Section with Modern Design */}
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="relative text-center bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 p-16 transition-all duration-500 hover:shadow-3xl animate-scale-in max-w-2xl group">
                {/* Animated background circles */}
                <div className="absolute top-10 right-10 w-32 h-32 bg-[#174a9f]/10 rounded-full blur-2xl animate-pulse-soft"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
                
                {/* Icon with multiple layers */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#174a9f] to-indigo-600 rounded-3xl animate-float shadow-2xl"></div>
                  <div className="absolute inset-2 bg-gradient-to-br from-[#2461c7] to-[#174a9f] rounded-2xl flex items-center justify-center">
                    <Package className="w-10 h-10 text-white animate-pulse-soft" />
                  </div>
                  {/* Glow ring */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#174a9f] to-indigo-600 rounded-3xl blur-lg opacity-50 animate-pulse-soft"></div>
                </div>
                
                <h1 className="text-gray-900 mb-4 group-hover:text-[#174a9f] transition-colors duration-300">
                  Welcome to Your Dashboard
                </h1>
                <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg leading-relaxed">
                  Your manufacturing operations content will appear here. Navigate to <span className="text-[#174a9f] font-medium">Orders</span> to view the assembly line management system.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => setCurrentPage('Orders')}
                    className="bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 px-8 h-12 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                    <span className="relative z-10 flex items-center gap-2">
                      View Orders
                      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </Button>
                  
                  <Button 
                    onClick={() => setShowAddOrderModal(true)}
                    variant="outline"
                    className="border-2 border-[#174a9f]/30 hover:border-[#174a9f] hover:bg-[#174a9f]/5 px-8 h-12 transition-all duration-300 hover:-translate-y-1"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="page-container">
      <DashboardHeader 
        onLogout={onLogout} 
        currentPage={currentPage}
        onNavigate={handleNavigate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBrowseExcel={handleBrowseExcel}
        onViewData={handleViewData}
        onPrintReport={handlePrintReport}
        selectedFileName={selectedFileName}
        onAddNewOrder={() => setShowAddOrderModal(true)}
      />
      
      {/* Dynamic Content Area */}
      <main className="relative">
        {renderContent()}
      </main>

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        onNavigateToOrders={() => {
          setShowAddOrderModal(false);
          setCurrentPage('Orders');
        }}
      />
    </div>
  );
}
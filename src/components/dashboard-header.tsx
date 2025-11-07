import React from 'react';
import { Search, MessageSquare, Bell, LogOut, Upload, Eye, Printer, Plus } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import gmLogo from 'figma:asset/af6b3e4cb666f0eba5140acbcb7f9e9a6916d8c0.png';

interface DashboardHeaderProps {
  onLogout: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onBrowseExcel?: () => void;
  onViewData?: () => void;
  onPrintReport?: () => void;
  selectedFileName?: string;
  onAddNewOrder?: () => void;
}

export function DashboardHeader({ 
  onLogout, 
  currentPage = 'Dashboard', 
  onNavigate,
  searchTerm = '',
  onSearchChange,
  onBrowseExcel,
  onViewData,
  onPrintReport,
  selectedFileName,
  onAddNewOrder
}: DashboardHeaderProps) {
  return (
    <header className="glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <img 
                src={gmLogo} 
                alt="GM Logo" 
                className="h-7 w-auto object-contain"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: 'Dashboard', label: 'Dashboard' },
                { id: 'Orders', label: 'Planning' },
                { id: 'Orders2', label: 'Material Issue' },
                { id: 'SemiQC', label: 'Semi QC' },
                { id: 'AfterPhosphatingQC', label: 'After Phosphating QC' },
                { id: 'Assembly', label: 'Assembly' },
                { id: 'Testing', label: 'Testing' },
                { id: 'SVS', label: 'SVS' },
                { id: 'Marking', label: 'Marking' },
                { id: 'AssignedOrders', label: 'Search Orders' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`nav-button relative overflow-hidden group ${
                    currentPage === item.id
                      ? 'nav-button-active'
                      : 'nav-button-inactive'
                  }`}
                >
                  {item.label}
                  {currentPage === item.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#174a9f] rounded-full"></span>
                  )}
                  {currentPage !== item.id && (
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#174a9f]/50 rounded-full group-hover:w-full transition-all duration-300"></span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section - Search & Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar for Orders page */}
            {currentPage === 'Orders' && onSearchChange && (
              <div className="relative">

              </div>
            )}
            


            {/* ADD NEW ORDER Button for Orders and Dashboard pages */}
            {(currentPage === 'Orders' || currentPage === 'Dashboard') && onAddNewOrder && (
              <Button 
                onClick={onAddNewOrder}
                className="flex items-center gap-2 bg-gradient-to-r from-[#174a9f] to-[#1a5cb8] hover:from-[#123a80] hover:to-[#174a9f] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Plus className="h-4 w-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                <span className="relative z-10">ADD NEW ORDER</span>
              </Button>
            )}

            {/* Default Icons for other pages */}
            {currentPage !== 'Orders' && (
              <>
                {/* Notification Icon */}
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 relative group">
                  <Bell className="h-4 w-4 text-gray-500 group-hover:scale-110 transition-transform duration-200" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse-soft"></div>
                </Button>
              </>
            )}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-[#a3c4e7] transition-all duration-300 hover:scale-110">
                  <AvatarImage src="/api/placeholder/36/36" />
                  <AvatarFallback className="bg-gradient-to-br from-[#2461c7] to-[#174a9f] text-white text-sm font-medium">
                    GM
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 mt-2 animate-scale-in">
                <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer focus:bg-red-50 group">
                  <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Modern Welcome Section */}
      <div className="bg-gradient-to-r from-[#e8f0f9]/50 to-indigo-50/50 border-t border-gray-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mt-1">Your manufacturing operations dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { format } from "date-fns";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

export type DateFilterMode = "year" | "month" | "range";

interface OrderFiltersProps {
  currentStage?: string;

  /** 🔍 SEARCH (controlled from PlanningPage) */
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  assemblyLineFilter: string;
  setAssemblyLineFilter: (value: string) => void;

  dateFilterMode: DateFilterMode;
  setDateFilterMode: (mode: DateFilterMode) => void;

  dateFrom: Date | undefined;
  setDateFrom: (date: Date | undefined) => void;

  dateTo: Date | undefined;
  setDateTo: (date: Date | undefined) => void;

  assemblyLines: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function OrderFilters({
  currentStage,
  searchTerm,
  setSearchTerm,
  assemblyLineFilter,
  setAssemblyLineFilter,
  dateFilterMode,
  setDateFilterMode,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  assemblyLines,
  onClearFilters,
  hasActiveFilters,
}: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  /** Restrict assembly when stage is fixed */
  const allowedAssemblies = [
    "assembly-a",
    "assembly-b",
    "assembly-c",
    "assembly-d",
  ];

  useEffect(() => {
    if (currentStage && allowedAssemblies.includes(currentStage)) {
      setAssemblyLineFilter(currentStage);
    }
  }, [currentStage, setAssemblyLineFilter]);

  const assemblyOptions = allowedAssemblies.includes(currentStage || "")
    ? [currentStage!]
    : assemblyLines;

  const getDateDisplayText = () => {
    if (dateFilterMode === "year" && dateFrom) {
      return format(dateFrom, "yyyy");
    }
    if (dateFilterMode === "month" && dateFrom) {
      return format(dateFrom, "MMMM yyyy");
    }
    if (dateFilterMode === "range") {
      if (dateFrom && dateTo) {
        return `${format(dateFrom, "MMM dd, yyyy")} → ${format(
          dateTo,
          "MMM dd, yyyy"
        )}`;
      }
      if (dateFrom) return `From ${format(dateFrom, "MMM dd, yyyy")}`;
      if (dateTo) return `Until ${format(dateTo, "MMM dd, yyyy")}`;
    }
    return "Select date";
  };

  return (
    <div className="bg-white border border-[#174a9f]/20 rounded-xl p-5 shadow-sm">
      {/* 🔍 SEARCH */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 pointer-events-none text-gray-400" />
        <Input
          type="text"
          placeholder="Search by Unique Code, GMSOA No, Party, PO No, Code No, Product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-white/80 backdrop-blur-sm border-gray-200/60 relative z-0 "
        />
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 border-b pb-2">
        <div className="flex items-center gap-2 text-[#174a9f]">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="font-medium">Advanced Filters</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((v) => !v)}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ASSEMBLY */}
            <div>
              <label className="text-xs text-[#174a9f]/70 pl-1">Assembly Line</label>
             <Select value={assemblyLineFilter} onValueChange={setAssemblyLineFilter}>
                <SelectTrigger className="h-10 bg-white/90 backdrop-blur-sm border-2 border-[#174a9f]/20 hover:border-[#174a9f]/40 focus:border-[#174a9f] transition-all duration-200 shadow-sm hover:shadow-md">
                  <SelectValue placeholder="Select Assembly" />
                </SelectTrigger>
                <SelectContent>
                  {!allowedAssemblies.includes(currentStage || "") && (
                    <SelectItem value="all">All</SelectItem>
                  )}
                  {assemblyOptions.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line.replace("assembly-", "").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DATE TYPE */}
            <div>
              <label className="text-xs text-[#174a9f]/70 pl-1">Date Filter Type</label>
              <Select
                value={dateFilterMode}
                onValueChange={(v: DateFilterMode) => {
                  setDateFilterMode(v);
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                <SelectTrigger className="h-10 bg-white/90 backdrop-blur-sm border-2 border-[#174a9f]/20 hover:border-[#174a9f]/40 focus:border-[#174a9f] transition-all duration-200 shadow-sm hover:shadow-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DATE PICKER */}
           <div className="space-y-1.5">
                           <label className="text-xs text-[#174a9f]/70 pl-1">
                             {dateFilterMode === 'year' && 'Select Year'}
                             {dateFilterMode === 'month' && 'Select Month'}
                             {dateFilterMode === 'range' && 'Select Date Range'}
                           </label>
                           
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 variant="outline"
                                 className="h-10 w-full justify-start text-left bg-white/90 backdrop-blur-sm border-2 border-[#174a9f]/20 hover:border-[#174a9f]/40 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                               >
                                 <CalendarIcon className="mr-2 h-4 w-4 text-[#174a9f]/70" />
                                 <span className={!dateFrom && !dateTo ? "text-gray-500" : ""}>
                                   {getDateDisplayText()}
                                 </span>
                               </Button>
                             </PopoverTrigger>
                           <PopoverContent className="w-auto p-0 border-2 border-[#174a9f]/20" align="start">
                             {dateFilterMode === 'year' && (
                               <div className="p-4 space-y-2">
                                 <div className="text-sm text-[#174a9f] mb-3">Select Year</div>
                                 <div className="grid grid-cols-2 gap-2">
                                   {years.map(year => (
                                     <Button
                                       key={year}
                                       variant="outline"
                                       className={`h-10 ${
                                         dateFrom && format(dateFrom, 'yyyy') === year.toString()
                                           ? 'bg-[#174a9f] text-white hover:bg-[#174a9f]/90'
                                           : 'hover:bg-[#174a9f]/10'
                                       }`}
                                       onClick={() => {
                                         const yearDate = new Date(year, 0, 1);
                                         setDateFrom(yearDate);
                                         setDateTo(new Date(year, 11, 31));
                                       }}
                                     >
                                       {year}
                                     </Button>
                                   ))}
                                 </div>
                               </div>
                             )}
                             
                             {dateFilterMode === 'month' && (
                               <div className="p-4 space-y-3">
                                 <div className="text-sm text-[#174a9f] mb-2">Select Month & Year</div>
                                 <Select
                                   value={dateFrom ? format(dateFrom, 'yyyy') : currentYear.toString()}
                                   onValueChange={(yearStr) => {
                                     const year = parseInt(yearStr);
                                     const month = dateFrom ? dateFrom.getMonth() : 0;
                                     const newDate = new Date(year, month, 1);
                                     setDateFrom(newDate);
                                     const lastDay = new Date(year, month + 1, 0).getDate();
                                     setDateTo(new Date(year, month, lastDay));
                                   }}
                                 >
                                   <SelectTrigger className="w-full">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     {years.map(year => (
                                       <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                                 <div className="grid grid-cols-3 gap-2">
                                   {months.map(({ value, label }) => {
                                     const year = dateFrom ? dateFrom.getFullYear() : currentYear;
                                     const isSelected = dateFrom && 
                                       dateFrom.getMonth() === value && 
                                       dateFrom.getFullYear() === year;
                                     
                                     return (
                                       <Button
                                         key={value}
                                         variant="outline"
                                         className={`h-9 text-xs ${
                                           isSelected
                                             ? 'bg-[#174a9f] text-white hover:bg-[#174a9f]/90'
                                             : 'hover:bg-[#174a9f]/10'
                                         }`}
                                         onClick={() => {
                                           const newDate = new Date(year, value, 1);
                                           setDateFrom(newDate);
                                           const lastDay = new Date(year, value + 1, 0).getDate();
                                           setDateTo(new Date(year, value, lastDay));
                                         }}
                                       >
                                         {label.slice(0, 3)}
                                       </Button>
                                     );
                                   })}
                                 </div>
                               </div>
                             )}
                             
                             {/* {dateFilterMode === 'range' && (
                               <div className="p-4">
                                 <div className="text-sm text-[#174a9f] mb-4">Select Date Range</div>
                                 <div className="flex gap-4">
                                   <div className="space-y-2">
                                     <div className="text-xs text-[#174a9f]/70 px-1">Start Date</div>
                                     <Calendar
                                       mode="single"
                                       selected={dateFrom}
                                       onSelect={setDateFrom}
                                       initialFocus
                                     />
                                   </div>
                                   <div className="space-y-2">
                                     <div className="text-xs text-[#174a9f]/70 px-1">End Date</div>
                                     <Calendar
                                       mode="single"
                                       selected={dateTo}
                                       onSelect={setDateTo}
                                       disabled={(date) => dateFrom ? date < dateFrom : false}
                                     />
                                   </div>
                                 </div>
                               </div>
                             )} */}
                             {dateFilterMode === 'range' && (
             <div className="p-4">
               <div className="text-sm text-[#174a9f] mb-4">Select Date Range</div>
           
               <div className="flex gap-4">
                 {/* Start Date */}
                 <div className="space-y-2">
                   <div className="text-xs text-[#174a9f]/70 px-1">Start Date</div>
                   <Calendar
                     mode="single"
                     selected={dateFrom}
                     onSelect={setDateFrom}
                     initialFocus
                     defaultMonth={dateFrom ?? new Date()}
                   />
                 </div>
           
                 {/* End Date */}
                 <div className="space-y-2">
                   <div className="text-xs text-[#174a9f]/70 px-1">End Date</div>
                   <Calendar
                     mode="single"
                     selected={dateTo}
                     onSelect={setDateTo}
                     disabled={date => dateFrom ? date < dateFrom : false}
                     defaultMonth={
                       dateTo 
                         ? dateTo 
                         : dateFrom 
                           ? new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 1)
                           : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                     }
                   />
                 </div>
               </div>
             </div>
           )}
           
                           </PopoverContent>
                         </Popover>
                       </div>
          </div>

          {/* CLEAR */}
          {hasActiveFilters && (
            <div className="flex justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

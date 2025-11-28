import React, { useState , useEffect } from 'react';
import { Filter, X, SlidersHorizontal, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";

export type DateFilterMode = 'year' | 'month' | 'range';

interface OrderFiltersProps {
  currentStage?: string;
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
  hasActiveFilters
}: OrderFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const allowedAssemblies = ["assembly-a", "assembly-b", "assembly-c", "assembly-d"];

useEffect(() => {
  if (allowedAssemblies.includes(currentStage)) {
    setAssemblyLineFilter(currentStage); // set default selected
  }
}, [currentStage]);

const assemblyOptions = allowedAssemblies.includes(currentStage)
  ? [currentStage]    // only show this assembly
  : assemblyLines;     // normal list


  
  // Generate month options
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  const getDateDisplayText = () => {
    if (dateFilterMode === 'year' && dateFrom) {
      return format(dateFrom, "yyyy");
    } else if (dateFilterMode === 'month' && dateFrom) {
      return format(dateFrom, "MMMM yyyy");
    } else if (dateFilterMode === 'range') {
      if (dateFrom && dateTo) {
        return `${format(dateFrom, "MMM dd")} - ${format(dateTo, "MMM dd, yyyy")}`;
      } else if (dateFrom) {
        return `From ${format(dateFrom, "MMM dd, yyyy")}`;
      } else if (dateTo) {
        return `Until ${format(dateTo, "MMM dd, yyyy")}`;
      }
    }
    return "Select date";
  };
  return (
    <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-[#f8fbff]/95 backdrop-blur-md border-2 border-[#174a9f]/20 rounded-xl p-5 shadow-lg shadow-[#174a9f]/5 transition-all duration-300 hover:shadow-xl animate-fade-in">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#174a9f]/5 to-transparent rounded-bl-full animate-pulse-soft" />
      
      <div className="relative">
        {/* Header with Collapse Toggle */}
        <div className="flex items-center justify-between gap-2.5 mb-4 pb-3 border-b-2 border-[#174a9f]/10">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#174a9f] to-[#1a5cb8] shadow-md shadow-[#174a9f]/20">
              <SlidersHorizontal className="h-4 w-4 text-white" />
            </div>
            <span className="text-[#174a9f]">Advanced Filters</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-[#174a9f] hover:bg-[#174a9f]/10 transition-all duration-300 hover:scale-110"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <ChevronDown className="h-4 w-4 transition-transform duration-300" />
            )}
          </Button>
        </div>
        
        {/* Collapsible Filter Content */}
        {isExpanded && (
          <div className="animate-fade-in-up">
            {/* All Filters in Single Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Assembly Line Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#174a9f]/70 pl-1">Assembly Line</label>
                <Select value={assemblyLineFilter} onValueChange={setAssemblyLineFilter}>
                  <SelectTrigger className="h-10 bg-white/90 backdrop-blur-sm border-2 border-[#174a9f]/20 hover:border-[#174a9f]/40 focus:border-[#174a9f] transition-all duration-200 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Select Line" />
                  </SelectTrigger>
                  {/* <SelectContent>
                    <SelectItem value="all">All Assembly Lines</SelectItem>
                    {assemblyLines.map(line => (
                      <SelectItem key={line} value={line}>{line}</SelectItem>
                    ))}
                  </SelectContent> */}
                  <SelectContent>
  {!allowedAssemblies.includes(currentStage) && (
    <SelectItem value="all">All Assembly Lines</SelectItem>
  )}

  {assemblyOptions.map(line => (
    <SelectItem key={line} value={line}>
      {line.replace("assembly-", "").toUpperCase()}


    </SelectItem>
  ))}
</SelectContent>

                </Select>
              </div>

              {/* Date Filter Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-[#174a9f]/70 pl-1">Date Filter Type</label>
                <Select value={dateFilterMode} onValueChange={(value: DateFilterMode) => {
                  setDateFilterMode(value);
                  // Clear dates when changing mode
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}>
                  <SelectTrigger className="h-10 bg-white/90 backdrop-blur-sm border-2 border-[#174a9f]/20 hover:border-[#174a9f]/40 focus:border-[#174a9f] transition-all duration-200 shadow-sm hover:shadow-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Filter by Year</SelectItem>
                    <SelectItem value="month">Filter by Month</SelectItem>
                    <SelectItem value="range">Filter by Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Smart Date Picker */}
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

          {/* Selected Date Range Display */}
          {(dateFrom || dateTo) && (
            <div className="mt-3 p-3 bg-gradient-to-r from-[#174a9f]/5 to-[#174a9f]/10 backdrop-blur-sm border-2 border-[#174a9f]/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#174a9f]" />
                <div className="flex-1">
                  <div className="text-xs text-[#174a9f]/70 mb-0.5">Selected Date Range (Assembly Date)</div>
                  <div className="text-[#174a9f]">
                    {dateFilterMode === 'year' && dateFrom && (
                      <span>{format(dateFrom, "yyyy")}</span>
                    )}
                    {dateFilterMode === 'month' && dateFrom && (
                      <span>{format(dateFrom, "MMMM yyyy")}</span>
                    )}
                    {dateFilterMode === 'range' && (
                      <>
                        {dateFrom && dateTo && (
                          <span>{format(dateFrom, "MMM dd, yyyy")} → {format(dateTo, "MMM dd, yyyy")}</span>
                        )}
                        {dateFrom && !dateTo && (
                          <span>From {format(dateFrom, "MMM dd, yyyy")}</span>
                        )}
                        {!dateFrom && dateTo && (
                          <span>Until {format(dateTo, "MMM dd, yyyy")}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="h-7 px-2 text-xs text-[#174a9f]/70 hover:text-[#174a9f] hover:bg-[#174a9f]/10"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t-2 border-[#174a9f]/10 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-9 px-4 text-xs bg-gradient-to-r from-red-50 to-red-100/80 text-red-600 hover:from-red-100 hover:to-red-200 border-2 border-red-200/60 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

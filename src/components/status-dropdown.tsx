import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export type StatusType = 'pending' | 'in-progress' | 'completed';

interface StatusDropdownProps {
  value: StatusType;
  onChange: (value: StatusType) => void;
  className?: string;
}

const statusConfig = {
  'pending': {
    label: 'Pending',
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200'
  },
  'in-progress': {
    label: 'In Progress',
    icon: Clock,
    bgColor: 'bg-[#e8f0f9]',
    textColor: 'text-[#123a7f]',
    iconColor: 'text-[#174a9f]',
    borderColor: 'border-[#a3c4e7]'
  },
  'completed': {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200'
  }
};

const StatusBadge = React.forwardRef<HTMLDivElement, { status: StatusType; className?: string }>(
  ({ status, className = "" }, ref) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div 
        ref={ref}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      >
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export const StatusDropdown: React.FC<StatusDropdownProps> = ({ 
  value, 
  onChange, 
  className = "" 
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-auto min-w-[140px] h-auto p-0 border-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 ${className}`}>
        <SelectValue asChild>
          <StatusBadge status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[160px] bg-white/95 backdrop-blur-sm border border-gray-200/60 shadow-lg">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem 
              key={key} 
              value={key}
              className="focus:bg-gray-50/80 cursor-pointer"
            >
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${config.bgColor} ${config.textColor} w-full`}>
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export { StatusBadge };
export default StatusDropdown;
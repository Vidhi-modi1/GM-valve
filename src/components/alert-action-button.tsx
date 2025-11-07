import React, { useState } from 'react';
import { Siren } from 'lucide-react';

interface AlertActionButtonProps {
  onAlert?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const AlertActionButton: React.FC<AlertActionButtonProps> = ({
  onAlert,
  className = '',
  size = 'md',
  disabled = false,
  children
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsActive(!isActive);
    setIsAnimating(true);
    
    // Trigger the siren animation
    setTimeout(() => setIsAnimating(false), 2000);
    
    onAlert?.();
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative">
      {/* Siren Light Effect */}
      {isActive && (
        <div className="absolute inset-0 -m-2">
          <div className={`
            absolute inset-0 rounded-full animate-ping
            ${isAnimating ? 'bg-red-400/30' : 'bg-red-500/20'}
          `} />
          <div className={`
            absolute inset-1 rounded-full animate-pulse
            ${isAnimating ? 'bg-red-500/40' : 'bg-red-400/25'}
          `} />
        </div>
      )}
      
      {/* Main Button */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          relative z-10 rounded-xl
          bg-white/70 backdrop-blur-sm border border-white/60
          hover:bg-white/80 hover:shadow-lg
          focus:outline-none focus:ring-2 focus:ring-[#174a9f]/50
          transition-all duration-200
          flex items-center justify-center
          group
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isActive ? 'shadow-lg shadow-red-500/25' : 'shadow-sm'}
          ${className}
        `}
      >
        {/* Alert Icon with Siren Animation */}
        <Siren 
          className={`transition-all duration-200 ${
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          } ${
            isActive 
              ? 'text-red-600 animate-siren-pulse' 
              : 'text-red-500'
          }`}
        />
        
        {/* Rotating Siren Effect */}
        {isActive && (
          <div className={`
            absolute inset-0 rounded-xl overflow-hidden
            ${isAnimating ? 'animate-spin' : ''}
          `}>
            <div className="absolute inset-0 bg-gradient-conic from-red-500/20 via-transparent to-red-500/20" />
          </div>
        )}
      </button>
      
      {/* Status Text */}
      {children && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className={`
            text-xs font-medium px-2 py-1 rounded-md
            ${isActive 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
            }
            transition-all duration-200
          `}>
            {children}
          </span>
        </div>
      )}
    </div>
  );
};

// Preset Emergency Button
export const EmergencyAlertButton: React.FC<{ onEmergency?: () => void }> = ({ 
  onEmergency 
}) => {
  return (
    <AlertActionButton
      size="lg"
      onAlert={onEmergency}
      className="bg-red-50/70 border-red-200/60 hover:bg-red-100/80"
    >
      Emergency
    </AlertActionButton>
  );
};

// Preset Warning Button
export const WarningAlertButton: React.FC<{ onWarning?: () => void }> = ({ 
  onWarning 
}) => {
  return (
    <AlertActionButton
      size="md"
      onAlert={onWarning}
      className="bg-yellow-50/70 border-yellow-200/60 hover:bg-yellow-100/80"
    >
      Warning
    </AlertActionButton>
  );
};

export default AlertActionButton;
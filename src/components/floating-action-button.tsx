import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  mainAction?: () => void;
  mainIcon?: React.ReactNode;
}

export function FloatingActionButton({ 
  actions = [], 
  mainAction,
  mainIcon = <Plus className="h-6 w-6" />
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (mainAction) {
      mainAction();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Action Items */}
      {isOpen && actions.length > 0 && (
        <div className="absolute bottom-20 right-0 space-y-3 animate-fade-in-up">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center justify-end gap-3 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Label */}
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {action.label}
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`
                  w-12 h-12 rounded-full shadow-lg
                  flex items-center justify-center
                  transition-all duration-300
                  hover:scale-110 active:scale-95
                  ${action.color || 'bg-white hover:bg-gray-50'}
                  border-2 border-gray-200
                  animate-scale-in
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleMainClick}
        className={`
          w-16 h-16 rounded-full
          bg-gradient-to-r from-[#174a9f] to-[#1a5cb8]
          hover:from-[#123a80] hover:to-[#174a9f]
          text-white shadow-2xl
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 active:scale-95
          hover:-translate-y-1
          relative overflow-hidden
          group
          ${isOpen ? 'rotate-45' : 'rotate-0'}
        `}
      >
        {/* Ripple effect background */}
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        
        {/* Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
          {isOpen ? <X className="h-6 w-6" /> : mainIcon}
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-[#174a9f] blur-xl opacity-50 -z-10 animate-pulse-soft" />
      </button>
    </div>
  );
}

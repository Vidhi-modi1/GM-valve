import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function ModernToast({ message, type, onClose }: ToastProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      bgClass: 'from-green-50 to-emerald-50',
      borderClass: 'border-green-200',
      iconClass: 'text-green-600',
      textClass: 'text-green-900'
    },
    error: {
      icon: XCircle,
      bgClass: 'from-red-50 to-rose-50',
      borderClass: 'border-red-200',
      iconClass: 'text-red-600',
      textClass: 'text-red-900'
    },
    warning: {
      icon: AlertCircle,
      bgClass: 'from-amber-50 to-yellow-50',
      borderClass: 'border-amber-200',
      iconClass: 'text-amber-600',
      textClass: 'text-amber-900'
    },
    info: {
      icon: Info,
      bgClass: 'from-blue-50 to-indigo-50',
      borderClass: 'border-blue-200',
      iconClass: 'text-blue-600',
      textClass: 'text-blue-900'
    }
  };

  const { icon: Icon, bgClass, borderClass, iconClass, textClass } = config[type];

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        bg-gradient-to-r ${bgClass} backdrop-blur-lg
        border-2 ${borderClass}
        rounded-xl shadow-xl
        p-4 pr-12
        animate-slide-in-right
        transition-all duration-300
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`${iconClass} h-5 w-5 mt-0.5 shrink-0`} />
        <p className={`${textClass} text-sm flex-1`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 transition-colors duration-200"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}

// Toast container for managing multiple toasts
export function ToastContainer({ toasts, removeToast }: { 
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ animationDelay: `${index * 0.1}s` }}>
          <ModernToast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

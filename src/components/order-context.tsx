import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OrderContextType {
  remarks: Record<string, string>;
  alertStatuses: Record<string, boolean>;
  updateRemark: (orderId: string, remark: string) => void;
  toggleAlertStatus: (orderId: string) => void;
  getRemark: (orderId: string) => string;
  getAlertStatus: (orderId: string) => boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [alertStatuses, setAlertStatuses] = useState<Record<string, boolean>>({});

  const updateRemark = (orderId: string, remark: string) => {
    setRemarks(prev => ({
      ...prev,
      [orderId]: remark
    }));
  };

  const toggleAlertStatus = (orderId: string) => {
    setAlertStatuses(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const getRemark = (orderId: string): string => {
    return remarks[orderId] || '';
  };

  const getAlertStatus = (orderId: string): boolean => {
    return alertStatuses[orderId] || false;
  };

  return (
    <OrderContext.Provider
      value={{
        remarks,
        alertStatuses,
        updateRemark,
        toggleAlertStatus,
        getRemark,
        getAlertStatus
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}

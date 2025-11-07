import React, { useState } from 'react';
import { LoginPage } from './components/login-page';
import { DashboardPage } from './components/dashboard-page';
import { OrderProvider } from './components/order-context';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <OrderProvider>
      <div className="relative min-h-screen">
        {/* Animated Background Gradient */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#174a9f]/10 via-indigo-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-300/5 via-blue-300/5 to-transparent rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-indigo-200/5 to-blue-200/5 rounded-full blur-3xl animate-float"></div>
        </div>
        
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <DashboardPage onLogout={handleLogout} />
        )}
      </div>
    </OrderProvider>
  );
}
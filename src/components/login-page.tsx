import React from 'react';
import { LoginForm } from './login-form';
import { VisualPreview } from './visual-preview';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Visual Preview */}
      <div className="flex-1 relative hidden lg:block">
        <VisualPreview />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 background-accent-blue relative overflow-hidden">
        {/* Enhanced visual background elements */}
        <div className="absolute inset-0 background-accent-blue"></div>
        <div className="background-glow-top animate-pulse-soft"></div>
        <div className="background-glow-bottom animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#174a9f]/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Login form container with enhanced emphasis */}
        <div className="relative w-full max-w-md form-card animate-scale-in hover:shadow-2xl transition-shadow duration-500">
          <LoginForm onLogin={onLogin} />
        </div>
      </div>
    </div>
  );
}
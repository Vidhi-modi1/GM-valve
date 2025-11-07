import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import gmLogo from 'figma:asset/af6b3e4cb666f0eba5140acbcb7f9e9a6916d8c0.png';

interface LoginFormProps {
  onLogin: () => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email and password are required");
      const data = await loginUser(email, password);
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      onLogin();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Logo */}
      <div className="mb-2 animate-fade-in">
        <img 
          src={gmLogo} 
          alt="GM Logo" 
          className="h-16 w-auto object-contain hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Heading */}
      <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-gray-900">Welcome Back</h1>
        <p className="text-gray-600">Log in to continue to your workspace.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <label htmlFor="email" className="text-gray-700">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-3xl h-12 px-4 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
            required
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <label htmlFor="password" className="text-gray-700">Password</label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-3xl h-12 px-4 pr-12 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#174a9f] transition-all duration-300 hover:scale-110"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center space-x-2 group">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              className="rounded border-2 hover:border-[#174a9f] transition-all duration-300"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer group-hover:text-[#174a9f] transition-colors duration-300">
              Remember me
            </label>
          </div>
        </div>

        {/* Sign In Button */}
        <Button 
          type="submit" disabled={loading}
          className="w-full h-12 rounded-3xl bg-gradient-to-r from-[#2461c7] to-[#174a9f] hover:from-[#174a9f] hover:to-[#123a7f] text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          <span className="relative z-10 flex items-center justify-center gap-2">
            Sign In
            <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
          </span>
        </Button>
      {error && (<p className="text-red-600 text-sm mt-2">{error}</p>)}
      </form>
    </div>
  );
}
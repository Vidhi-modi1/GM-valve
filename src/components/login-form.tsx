
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

import gmLogo from "../assets/gm-logo.png";

interface LoginFormProps {
  onLogin?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser(email, password);
      if (response && response.status && response.data) {
        const { user, token } = response.data;
        // store full user object (keeps role as object) and token separately
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        // normalize role path: use role.name if object exists
        const roleName =
          (user && (user.role?.name || user.role)) || "dashboard";
        const rolePath = String(roleName).toLowerCase().replace(/\s+/g, "-");

        // optional callback
        onLogin && onLogin();

        navigate(`/${rolePath}`);
      } else {
        setError(response?.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Check your credentials or server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
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

  {error && (
    <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg py-2 text-center animate-fade-in-up">
      {error}
    </p>
  )}

  {/* Email Field */}
  <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
    <label htmlFor="email" className="text-gray-700 text-sm font-medium">
      Email
    </label>
    <Input
      id="email"
      type="email"
      placeholder="Enter your email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      className="rounded-3xl h-12 px-4 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
    />
  </div>

  {/* Password Field */}
  <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
    <label htmlFor="password" className="text-gray-700 text-sm font-medium">
      Password
    </label>
    <div className="relative">
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="rounded-3xl h-12 px-4 pr-12 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
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
  <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
    <label className="flex items-center gap-2 text-sm cursor-pointer group">
      <Checkbox
        checked={rememberMe}
        onCheckedChange={setRememberMe}
        className="rounded border-2 hover:border-[#174a9f] transition-all duration-300"
      />
      <span className="text-gray-600 group-hover:text-[#174a9f] transition-colors duration-300">
        Remember me
      </span>
    </label>

    {/* Optional Forgot Password link */}
    <a href="#" className="text-sm text-[#174a9f] hover:underline">
      Forgot Password?
    </a>
  </div>

  {/* Login Button */}
  <Button
    type="submit"
    className="w-full h-12 rounded-3xl bg-gradient-to-r from-[#2461c7] to-[#174a9f] hover:from-[#174a9f] hover:to-[#123a7f] text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0 animate-fade-in-up"
    style={{ animationDelay: '0.3s' }}
  >
    <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
    <span className="relative z-10 flex items-center justify-center gap-2">
      {loading ? "Logging in..." : "Sign In"}
      <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
    </span>
  </Button>
  </form>

  );
};

export default LoginForm;

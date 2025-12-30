// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { loginUser } from "../api/auth";
// import { deriveRoleFromEmail } from "../services/authService";
// import { Button } from "./ui/button";
// import { Input } from "./ui/input";
// import { Checkbox } from "./ui/checkbox";
// import { Eye, EyeOff } from "lucide-react";

// import gmLogo from "../assets/gm-logo.png";

// interface LoginFormProps {
//   onLogin?: () => void;
// }

// export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const response = await loginUser(email, password);
//       if (response && response.status && response.data) {
//         const { user, token } = response.data;
//         // store full user object (keeps role as object) and token separately
//         localStorage.setItem("user", JSON.stringify(user));
//         localStorage.setItem("token", token);

//         // normalize role path robustly: handle both object and string, and map known variants
//         const rawRoleName = (user && (user.role?.name || user.role)) || "";
//         const rolePath = normalizeRoleToRoute(String(rawRoleName), email);

//         // optional callback
//         onLogin && onLogin();

//         navigate(`/${rolePath}`);
//       } else {
//         setError(response?.message || "Login failed");
//       }
//     } catch (err: any) {
//       setError(err?.message || "Login failed. Check your credentials or server.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Map backend role or email-derived role to our route slugs
//   function normalizeRoleToRoute(roleRaw: string, email: string): string {
//     const base = (roleRaw || "").toLowerCase().replace(/\s+/g, "-");
//     const derived = deriveRoleFromEmail(email);
//     const candidates = [base, derived];

//     for (const r of candidates) {
//       if (!r) continue;
//       if (r === "planning" || r.startsWith("planning")) return "planning";
//       if (r === "material-issue" || r.startsWith("materialissue")) return "material-issue";
//       if (r === "semi-qc" || r.startsWith("semiqc")) return "semi-qc";
//       // Our route is 'phosphating' (module name), while role may be 'phosphating-qc' or misspelled
//       if (r === "phosphating" || r === "phosphating-qc" || r.startsWith("phospatingqc") || r.startsWith("phosphatingqc")) return "phosphating";
//       if (r === "assembly" || r.startsWith("assembly")) return "assembly";
//       if (r === "testing" || r.startsWith("testing")) return "testing";
//       if (r === "marking" || r.startsWith("marking")) return "marking";
//       if (r === "svs" || r.startsWith("svs")) return "svs";
//       if (r === "pdi" || r.startsWith("pdi")) return "pdi";
//       if (r === "tpi" || r.startsWith("tpi")) return "tpi";
//       if (r === "dispatch" || r.startsWith("dispatch")) return "dispatch";
//       if (r === "admin") return "planning"; // default admin landing
//     }

//     // Fallback
//     return "planning";
//   }

//   return (

//     <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
//       {/* Logo */}
//       <div className="mb-2 animate-fade-in">
//         <img
//           src={gmLogo}
//           alt="GM Logo"
//           className="h-16 w-auto object-contain hover:scale-110 transition-transform duration-300"
//         />
//       </div>

//       {/* Heading */}
//       <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
//         <h1 className="text-gray-900">Welcome Back</h1>
//         <p className="text-gray-600">Log in to continue to your workspace.</p>
//       </div>

//   {error && (
//     <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg py-2 text-center animate-fade-in-up">
//       {error}
//     </p>
//   )}

//   {/* Email Field */}
//   <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
//     <label htmlFor="email" className="text-gray-700 text-sm font-medium">
//       Email
//     </label>
//     <Input
//       id="email"
//       type="email"
//       placeholder="Enter your email"
//       value={email}
//       onChange={(e) => setEmail(e.target.value)}
//       required
//       className="rounded-3xl h-12 px-4 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
//     />
//   </div>

//   {/* Password Field */}
//   <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
//     <label htmlFor="password" className="text-gray-700 text-sm font-medium">
//       Password
//     </label>
//     <div className="relative">
//       <Input
//         id="password"
//         type={showPassword ? "text" : "password"}
//         placeholder="Enter your password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         required
//         className="rounded-3xl h-12 px-4 pr-12 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
//       />
//       <button
//         type="button"
//         onClick={() => setShowPassword(!showPassword)}
//         className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#174a9f] transition-all duration-300 hover:scale-110"
//       >
//         {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//       </button>
//     </div>
//   </div>

//   {/* Remember Me */}
//   <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
//     <label className="flex items-center gap-2 text-sm cursor-pointer group">
//       <Checkbox
//         checked={rememberMe}
//         onCheckedChange={setRememberMe}
//         className="rounded border-2 hover:border-[#174a9f] transition-all duration-300"
//       />
//       <span className="text-gray-600 group-hover:text-[#174a9f] transition-colors duration-300">
//         Remember me
//       </span>
//     </label>

//     {/* Optional Forgot Password link */}
//     <a href="#" className="text-sm text-[#174a9f] hover:underline">
//       Forgot Password?
//     </a>
//   </div>

//   {/* Login Button */}
//   <Button
//     type="submit"
//     className="w-full h-12 rounded-3xl bg-gradient-to-r from-[#2461c7] to-[#174a9f] hover:from-[#174a9f] hover:to-[#123a7f] text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0 animate-fade-in-up"
//     style={{ animationDelay: '0.3s' }}
//   >
//     <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
//     <span className="relative z-10 flex items-center justify-center gap-2">
//       {loading ? "Logging in..." : "Sign In"}
//       <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
//     </span>
//   </Button>
//   </form>

//   );
// };

// export default LoginForm;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { deriveRoleFromEmail } from "../services/authService";
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
  // const [superAdminMode, setSuperAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
     const response = await loginUser(identifier, password);


      // SUCCESS
      if (response?.status === true && response?.data) {
        const { user, token } = response.data;

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        const rawRoleName = (user && (user.role?.name || user.role)) || "";
        const rolePath = normalizeRoleToRoute(String(rawRoleName), email);

        onLogin && onLogin();
        navigate(`/${rolePath}`);
      }
      // ERROR
      else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Full role mapping logic — includes all stages and safe fallbacks
  function normalizeRoleToRoute(roleRaw: string, email: string): string {
    const base = (roleRaw || "").toLowerCase().replace(/\s+/g, "-");
    const derived = deriveRoleFromEmail(email);
    const candidates = [base, derived];

    for (const r of candidates) {
      if (!r) continue;

      // Core roles
      if (r === "admin") return "admin";
      if (r === "planning" || r.startsWith("planning")) return "planning";
      if (r === "material-issue" || r.startsWith("materialissue"))
        return "material-issue";
      if (r === "semi-qc" || r.startsWith("semiqc")) return "semi-qc";
      if (
        r === "phosphating" ||
        r === "phosphating-qc" ||
        r.startsWith("phosp")
      )
        return "phosphating";
      // Sub-roles for Assembly lines (check explicit lines BEFORE generic 'assembly')
      if (r === "assembly-a" || r.startsWith("assembly-a")) return "assembly-a";
      if (r === "assembly-b" || r.startsWith("assembly-b")) return "assembly-b";
      if (r === "assembly-c" || r.startsWith("assembly-c")) return "assembly-c";
      if (r === "assembly-d" || r.startsWith("assembly-d")) return "assembly-d";
      // Generic assembly fallback
      if (r === "assembly") return "assembly-a";
      if (r === "svs" || r.startsWith("svs")) return "svs";
      if (r === "tpi" || r.startsWith("tpi")) return "tpi";
      if (r === "dispatch" || r.startsWith("dispatch")) return "dispatch";

      // Extended multi-stage roles
      if (r === "testing" || r === "testing1" || r.startsWith("testing1"))
        return "testing1";
      if (r === "testing2" || r.startsWith("testing2")) return "testing2";

      if (r === "marking" || r === "marking1" || r.startsWith("marking1"))
        return "marking1";
      if (r === "marking2" || r.startsWith("marking2")) return "marking2";

      if (r === "pdi" || r === "pdi1" || r.startsWith("pdi1")) return "pdi1";
      if (r === "pdi2" || r.startsWith("pdi2")) return "pdi2";

      // Customer Support
      if (r === "customer-support" || r.startsWith("customersupport"))
        return "customer-support";
    }

    // Default fallback
    return "planning";
  }

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
      <div
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <h1 className="text-gray-900 font-semibold text-xl">Welcome Back</h1>
        <p className="text-gray-600">Log in to continue to your workspace.</p>
      </div>

      {error && (
        <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg py-2 text-center animate-fade-in-up">
          {error}
        </p>
      )}

      {/* Email */}
      <div
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <label htmlFor="email" className="text-gray-700 text-sm font-medium">
          Username or Email
        </label>
        {/* <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-3xl h-12 px-4 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
        /> */}
        <Input
  type="text"
  placeholder="Enter username or email"
  value={identifier}
  onChange={(e) => setIdentifier(e.target.value)}
  required
   className="rounded-3xl h-12 px-4 bg-white/80 border-2 border-gray-200 hover:border-[#174a9f]/50 focus:border-[#174a9f] focus:ring-2 focus:ring-[#174a9f]/20 transition-all duration-300 shadow-sm hover:shadow-md"
/>
      </div>

      {/* Password */}
      <div
        className="space-y-2 animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
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
      <div
        className="flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: "0.25s" }}
      >
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

        {/* <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <Checkbox
            checked={superAdminMode}
            onCheckedChange={(c) => setSuperAdminMode(Boolean(c))}
            className="rounded border-2 hover:border-[#174a9f] transition-all duration-300"
          />
          <span className="text-gray-600 group-hover:text-[#174a9f] transition-colors duration-300">
            Super Admin (testing)
          </span>
        </label> */}

        {/* <a href="#" className="text-sm text-[#174a9f] hover:underline">
          Forgot Password?
        </a> */}
      </div>

      {/* Button */}
      <Button
        type="submit"
        className="w-full h-12 rounded-3xl bg-gradient-to-r from-[#2461c7] to-[#174a9f] hover:from-[#174a9f] hover:to-[#123a7f] text-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 active:translate-y-0 animate-fade-in-up"
        style={{ animationDelay: "0.3s" }}
      >
        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? "Logging in..." : "Sign In"}
          <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">
            →
          </span>
        </span>
      </Button>
    </form>
  );
};

export default LoginForm;

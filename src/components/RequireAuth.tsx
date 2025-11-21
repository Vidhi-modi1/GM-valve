import React from "react";
import { Navigate } from "react-router-dom";

interface RequireAuthProps {
  children: React.ReactNode;
}

// Minimal auth guard: requires user to be logged in, no role check
const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const userData = localStorage.getItem("user");
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
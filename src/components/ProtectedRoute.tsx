// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRole: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const userData = localStorage.getItem("user");

  if (!userData) {
    return <Navigate to="/" replace />;
  }

  const parsedUser = JSON.parse(userData);

  // ✅ handle both cases — string or object
  const userRole =
    typeof parsedUser.role === "object"
      ? parsedUser.role.name?.toLowerCase()
      : parsedUser.role?.toLowerCase();

  if (userRole !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

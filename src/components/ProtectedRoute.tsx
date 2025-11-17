// // src/components/ProtectedRoute.tsx
// import React from "react";
// import { Navigate } from "react-router-dom";

// interface ProtectedRouteProps {
//   allowedRole: string;
//   children: React.ReactNode;
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
//   const userData = localStorage.getItem("user");

//   if (!userData) {
//     return <Navigate to="/" replace />;
//   }

//   const parsedUser = JSON.parse(userData);

//   // ✅ handle both cases — string or object, and normalize to route slug
//   const rawRole =
//     typeof parsedUser.role === "object"
//       ? parsedUser.role.name
//       : parsedUser.role;

//   const normalize = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, "-");
//   const mapRoleToRoute = (r: string) => {
//     // Map known variants to route paths
//     switch (r) {
//       case "phosphating-qc":
//         return "phosphating"; // app route is /phosphating
//       default:
//         return r;
//     }
//   };

//   const normalizedUserRole = mapRoleToRoute(normalize(rawRole));
//   const normalizedAllowedRole = normalize(allowedRole);

//   if (normalizedUserRole !== normalizedAllowedRole) {
//     return <Navigate to="/" replace />;
//   }

//   return <>{children}</>;
// };

// export default ProtectedRoute;

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

  // handle both cases — string or object, and normalize to route slug
  const rawRole = typeof parsedUser.role === "object" ? parsedUser.role.name : parsedUser.role;

  const normalize = (s?: string) => (s || "").toLowerCase().replace(/\s+/g, "-");
  const mapRoleToRoute = (r: string) => {
    switch (r) {
      case "phosphating-qc":
        return "phosphating"; // app route is /phosphating
      default:
        return r;
    }
  };

  const normalizedUserRole = mapRoleToRoute(normalize(rawRole));
  const normalizedAllowedRole = normalize(allowedRole);

  // Grant Admin users access to all routes
  if (normalizedUserRole === "admin") {
    return <>{children}</>;
  }

  if (normalizedUserRole !== normalizedAllowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

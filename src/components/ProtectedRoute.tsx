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
  const superAdmin = localStorage.getItem("superAdmin") === "true";

  // 🛑 If no user is stored, redirect to login
  if (!userData) {
    return <Navigate to="/" replace />;
  }

  const parsedUser = JSON.parse(userData);

  // Handle both cases — role as object or string
  const rawRole =
    typeof parsedUser.role === "object"
      ? parsedUser.role.name
      : parsedUser.role;

  // Utility to normalize role strings
  const normalize = (s?: string) =>
    (s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-");

  // Map backend role names to frontend route slugs
  const mapRoleToRoute = (r: string) => {
    if (!r) return "planning";

    // 🔹 Core roles
    if (r.includes("admin")) return "planning";
    if (r.includes("planning")) return "planning";
    if (r.includes("material")) return "material-issue";
    if (r.includes("semi")) return "semi-qc";
    if (r.includes("phosphat")) return "phosphating";
    if (r.includes("assembly")) return "assembly";
    if (r.includes("svs")) return "svs";
    if (r.includes("tpi")) return "tpi";
    if (r.includes("dispatch")) return "dispatch";

    // 🔹 Multi-stage Testing roles
    if (r.includes("testing1") || r.includes("testing-1")) return "testing1";
    if (r.includes("testing2") || r.includes("testing-2")) return "testing2";
    if (r === "testing") return "testing1"; // default to first testing stage

    // 🔹 Multi-stage Marking roles
    if (r.includes("marking1") || r.includes("marking-1")) return "marking1";
    if (r.includes("marking2") || r.includes("marking-2")) return "marking2";
    if (r === "marking") return "marking1";

    // 🔹 Multi-stage PDI roles
    if (r.includes("pdi1") || r.includes("pdi-1")) return "pdi1";
    if (r.includes("pdi2") || r.includes("pdi-2")) return "pdi2";
    if (r === "pdi") return "pdi1";

    // Fallback
    return r;
  };

  const normalizedUserRole = mapRoleToRoute(normalize(rawRole));
  const normalizedAllowedRole = normalize(allowedRole);

  // 🔒 If current user’s role doesn’t match route access → redirect to login
  if (!superAdmin && normalizedUserRole !== normalizedAllowedRole) {
    console.warn(
      `Access denied: user role "${normalizedUserRole}" cannot access "${normalizedAllowedRole}" page`
    );
    return <Navigate to="/" replace />;
  }

  // ✅ Allow access
  return <>{children}</>;
};

export default ProtectedRoute;

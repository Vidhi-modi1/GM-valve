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
    return <Navigate to="/login" replace />;
  }

  const parsedUser = JSON.parse(userData);

  // Extract role string
  const rawRole =
    typeof parsedUser.role === "object"
      ? parsedUser.role.name
      : parsedUser.role;

  // ✅ Move normalize BEFORE console.log
  const normalize = (s?: string) =>
    (s || "").toLowerCase().replace(/\s+/g, "-");

  const mapRoleToRoute = (r: string) => {
    switch (r) {
      case "phosphating-qc":
        return "phosphating";
      case "assemblya":
        return "assembly-a";
      case "assemblyb":
        return "assembly-b";
      case "assemblyc":
        return "assembly-c";
      case "assemblyd":
        return "assembly-d";
      default:
        return r;
    }
  };

  const normalizedUserRole = mapRoleToRoute(normalize(rawRole));
  const normalizedAllowedRole = normalize(allowedRole);



  // Allow admin full access
  if (normalizedUserRole === "admin" || normalizedUserRole === "planning") {
    return <>{children}</>;
  }

  // Allow exact role match
  if (normalizedUserRole === normalizedAllowedRole) {
    return <>{children}</>;
  }

  // // Umbrella role access: allow parent roles to access sub-stages
  // const hasUmbrellaAccess = (userRole: string, allowed: string) => {
  //   // Testing umbrella can access testing1 and testing2
  //   if (userRole === "testing" && (allowed === "testing1" || allowed === "testing2")) return true;

  //   // Marking umbrella can access marking1 and marking2
  //   if (userRole === "marking" && (allowed === "marking1" || allowed === "marking2")) return true;

  //   // PDI umbrella can access pdi1 and pdi2
  //   if (userRole === "pdi" && (allowed === "pdi1" || allowed === "pdi2")) return true;

  //   return false;
  // };
  const hasUmbrellaAccess = (userRole: string, allowed: string) => {
  // Testing umbrella can access testing1 and testing2
  if (userRole === "testing" && (allowed === "testing1" || allowed === "testing2")) return true;

  // Marking umbrella can access marking1 and marking2
  if (userRole === "marking" && (allowed === "marking1" || allowed === "marking2")) return true;

  // PDI umbrella can access pdi1 and pdi2
  if (userRole === "pdi" && (allowed === "pdi1" || allowed === "pdi2")) return true;

  // ✅ CROSS ACCESS: Testing1 ↔ Assembly A
  if (userRole === "testing1" && allowed === "assembly-a") return true;
  if (userRole === "assembly-a" && allowed === "testing1") return true;

  // ✅ SHARED ACCESS: All Assembly roles can access shared pages
  if (userRole.startsWith("assembly-") && allowed === "assembly-shared") return true;

  return false;
};


  if (hasUmbrellaAccess(normalizedUserRole, normalizedAllowedRole)) {
    return <>{children}</>;
  }

  if (normalizedUserRole !== normalizedAllowedRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

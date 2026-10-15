import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

  // 1. Si no hay token, enviar al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Detección robusta del rol actual
  const role = (localStorage.getItem("role") || localStorage.getItem("user_role") || localStorage.getItem("userRole") || "").toLowerCase();
  const userType = (localStorage.getItem("user_type") || localStorage.getItem("tipo_usuario") || "").toLowerCase();

  let jwtRole = "";
  try {
    const payloadBase64 = token.split('.')[1];
    if (payloadBase64) {
      const decodedPayload = JSON.parse(atob(payloadBase64));
      jwtRole = (decodedPayload.role || decodedPayload.user_type || decodedPayload.tipo_usuario || decodedPayload.rol || "").toLowerCase();
    }
  } catch {
    // Si falla el token
  }

  const userRoleFinal = role || userType || jwtRole;

  // 3. Validar si los roles permitidos incluyen al usuario
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some((r) => userRoleFinal.includes(r.toLowerCase()));

    if (!hasPermission) {
      if (userRoleFinal.includes("fiscalizador")) {
        return <Navigate to="/create-ticket" replace />;
      }
      if (userRoleFinal.includes("supervisor") || userRoleFinal.includes("empresa")) {
        return <Navigate to="/subsanacion" replace />;
      }
      return <Navigate to="/bandeja-municipal" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
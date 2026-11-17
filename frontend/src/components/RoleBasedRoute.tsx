// src/components/RoleBasedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

export default function RoleBasedRoute() {
  const userDataString = localStorage.getItem('user_data');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const rol = userData?.rol?.toLowerCase();

  // Si es fiscalizador, bloquear el acceso al dashboard y mandarlo a crear observación
  if (rol === 'fiscalizador') {
    return <Navigate to="/fiscalizadorHome" replace />;
  }

  return <Outlet />;
}
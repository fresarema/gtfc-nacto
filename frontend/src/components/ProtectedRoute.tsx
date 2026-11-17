import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('access_token');

  // Validamos que el token exista y tenga contenido real
  const isAuthenticated = token && token !== '' && token !== 'undefined';

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
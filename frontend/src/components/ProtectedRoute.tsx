import { Navigate, Outlet } from "react-router-dom";
import { isSessionValid } from "../utils/auth"; // Ajusta la ruta a tu función de auth

const ProtectedRoute = () => {
  // Si el usuario no está autenticado, redirige al login
  if (!isSessionValid()) {
    return <Navigate to="/login" replace />;
  }

  // Outlet renderiza dinámicamente la ruta hija activa (/home, /create-ticket, /profile)
  return <Outlet />;
};

export default ProtectedRoute;
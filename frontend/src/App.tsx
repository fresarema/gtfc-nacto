import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Profile from "./pages/Profile/Profile";
import BandejaMunicipal from "./pages/BandejaMunicipal/BandejaMunicipal";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import DetalleTicket from "./pages/DetalleTicket/DetalleTicket";
import SubsanacionTickets from "./pages/SubsanacionTickets/SubsanacionTickets"; // Módulo de auditoría de tickets
import ObservacionesATickets from "./pages/ObservacionesATickets/ObservacionesATickets"; // Módulo de conversión de observaciones
import DetalleSubsanacion from "./pages/DetalleSubsanacion/DetalleSubsanacion";
import HistorialTickets from "./pages/HistorialTickets/HistorialTickets";
import CrearUsuario from "./pages/CrearUsuario/CrearUsuario";
import GestionObservacion from "./pages/GestionObservacion/GestionObservacion";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de acceso */}
        <Route path="/login" element={<Login />} />

        {/* Ruta general autenticada */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Rutas exclusivas para Fiscalizadores */}
        <Route element={<ProtectedRoute allowedRoles={['fiscalizador']} />}>
          <Route path="/create-ticket" element={<CreateTicket />} />
        </Route>

        {/* Rutas exclusivas para Administradores */}
        <Route element={<ProtectedRoute allowedRoles={['administrador', 'admin']} />}>
          <Route element={<MainLayout />}>
            <Route path="/crear-usuario" element={<CrearUsuario />} />
          </Route>
        </Route>

        {/* Rutas compartidas */}
        <Route element={<ProtectedRoute allowedRoles={['administrador', 'admin', 'usuario municipal', 'supervisor de empresa externa', 'supervisor']} />}>
          <Route element={<MainLayout />}>
            <Route path="/bandeja-municipal" element={<BandejaMunicipal />} />
            
            {/* 1. Vista para convertir observaciones de terreno en tickets */}
            <Route path="/observaciones-pendientes" element={<ObservacionesATickets />} />
            <Route path="/observacion/:id" element={<GestionObservacion />} />
            
            {/* 2. Vista para auditar y gestionar los tickets oficiales creados */}
            <Route path="/subsanacion" element={<SubsanacionTickets />} />
            <Route path="/subsanacion/:id" element={<DetalleSubsanacion />} />
            
            <Route path="/historial-tickets" element={<HistorialTickets />} />
          </Route>
        </Route>

        {/* Ruta EXCLUSIVA de Detalle de Ticket Oficial */}
        <Route element={<ProtectedRoute allowedRoles={['administrador', 'admin', 'usuario municipal']} />}>
          <Route element={<MainLayout />}>
            <Route path="/detalle-ticket/:id" element={<DetalleTicket />} />
          </Route>
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CreateObservationPage from './pages/CreateObservation/CreateObservationPage';
import TicketDetailPage from './pages/TicketDetail/TicketDetailPage';
import ObservacionesPendientesPage from './pages/Observaciones/ObservacionesPendientesPage';
import TicketsCerradosPage from './pages/Tickets/TicketsCerradosPage';
import ProtectedRoute from './components/ProtectedRoute';
import EmpresasPage from './pages/EmpresasPage/EmpresasPage';
import UsuariosPage from './pages/UsuariosPage/UsuariosPage';
import CrearEmpresaPage from './pages/CrearEmpresa/CrearEmpresaPage';
import CrearUsuarioPage from './pages/CrearUsuario/CrearUsuarioPage';
import TicketsSupervisorPage from './pages/Tickets/TicketsSupervisorPage';
import TicketsActivosPage from './pages/Tickets/TicketsActivosPage';
import FiscalizadorHome from './pages/FiscalizadorHome/FiscalizadorHome';
import FiscalizadorObservacionesPage from './pages/FiscalizadorObservacionesPage/FiscalizadorObservacionesPage';
import CrearContratoPage from './pages/CrearContrato/CrearContratoPage';


function NonFiscalizadorRoute() {
  const userDataString = localStorage.getItem('user_data');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const rol = userData?.rol?.toLowerCase() || '';

  if (rol.includes('fiscalizador')) {
    return <Navigate to="/fiscalizador" replace />;
  }

  return <Outlet />;
}

function RoleBasedRedirect() {
  const userDataString = localStorage.getItem('user_data');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const rol = userData?.rol?.toLowerCase() || '';

  if (rol.includes('fiscalizador')) {
    return <Navigate to="/fiscalizador" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function MunicipalOrAdminRoute() {
  const userDataString = localStorage.getItem('user_data');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const rol = userData?.rol?.toLowerCase() || '';

  const esMunicipalOrAdmin = ['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol);

  if (!esMunicipalOrAdmin) {
    return <RoleBasedRedirect />;
  }

  return <Outlet />;
}

// Guardián exclusivo para Administradores
function AdminOnlyRoute() {
  const userDataString = localStorage.getItem('user_data');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const rol = userData?.rol?.toLowerCase() || '';

  const esAdmin = ['administrador', 'admin'].includes(rol);

  if (!esAdmin) {
    return <RoleBasedRedirect />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Router>
      <div className="w-screen min-h-screen bg-[#f8fafc] text-gray-900 m-0 p-0">
        <main className="w-full min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas Protegidas por Autenticación */}
            <Route element={<ProtectedRoute />}>

              {/* Portal y Vistas del Fiscalizador */}
              
              <Route path="/fiscalizador" element={<FiscalizadorHome />} />
              <Route path="/fiscalizador/observaciones" element={<FiscalizadorObservacionesPage />} />
              <Route path="/observaciones/nueva" element={<CreateObservationPage />} />
              

              {/* Vistas bloqueadas para el Fiscalizador (Dashboard y gestión general) */}
              <Route element={<NonFiscalizadorRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tickets/activos" element={<TicketsActivosPage />} />
                <Route path="/supervisor/tickets" element={<TicketsSupervisorPage />} />
              </Route>

              {/* Vistas exclusivas de Validación e Historial (Admin y Municipal) */}
              <Route element={<MunicipalOrAdminRoute />}>
                <Route path="/observaciones/pendientes" element={<ObservacionesPendientesPage />} />
                <Route path="/tickets/cerrados" element={<TicketsCerradosPage />} />
              </Route>

              {/* Vistas exclusivas de Administración (Solo Administrador) */}
              <Route element={<AdminOnlyRoute />}>
                <Route path="/empresas" element={<EmpresasPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/empresas/nueva" element={<CrearEmpresaPage />} />
                <Route path="/usuarios/nuevo" element={<CrearUsuarioPage />} />
                <Route path="/contratos/nuevo" element={<CrearContratoPage />} />
              </Route>

              {/* Vistas de detalle de Tickets */}
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* Redirección inteligente por defecto según el rol */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
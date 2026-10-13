import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Profile from "./pages/Profile/Profile";
import BandejaMunicipal from "./pages/BandejaMunicipal/BandejaMunicipal";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import SolicitudesValidacion from "./pages/SolicitudesValidacion/SolicitudesValidacion";
import DetalleTicket from "./pages/DetalleTicket/DetalleTicket";
import SubsanacionTickets from "./pages/SubsanacionTickets/SubsanacionTickets";
import DetalleSubsanacion from "./pages/DetalleSubsanacion/DetalleSubsanacion";
import HistorialTickets from "./pages/HistorialTickets/HistorialTickets";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de acceso */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          {/* Vistas generales sin barra lateral */}
          <Route path="/home" element={<Home />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/profile" element={<Profile />} />

          {/* Vistas de la Bandeja Municipal que SÍ muestran la barra lateral */}
          <Route element={<MainLayout />}>
            <Route path="/bandeja-municipal" element={<BandejaMunicipal />} />
            <Route path="/solicitudes-validacion" element={<SolicitudesValidacion />} />
            <Route path="/solicitudes-validacion/:id" element={<DetalleTicket />} />
            <Route path="/subsanacion" element={<SubsanacionTickets />} />
            <Route path="/subsanacion/:id" element={<DetalleSubsanacion />} />
            <Route path="/historial-tickets" element={<HistorialTickets />} />
          </Route>
        </Route>

        {/* Redirección por defecto: si entran a '/' o ruta inexistente */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import CreateTicket from "./pages/CreateTicket/CreateTicket";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de acceso */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas (solo accesibles si el usuario inició sesión) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-ticket" element={<CreateTicket />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Redirección por defecto: si entran a '/' o cualquier ruta no existente */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
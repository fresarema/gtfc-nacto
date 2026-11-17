import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  const esMunicipalOrAdmin = ['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol);
  const esAdmin = ['administrador', 'admin'].includes(rol);
  const esSupervisor = rol.includes('supervisor');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">gtfc-nacto</span>
        <span className="sidebar-role">{usuario?.rol || 'Usuario'}</span>
      </div>

      <nav className="sidebar-nav">
        {/* CATEGORÍA: PRINCIPAL */}
        <div className="sidebar-category-title">Principal</div>
        <Link 
          to="/dashboard" 
          className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Panel Principal (KPIs)
        </Link>

        {/* CATEGORÍA: TICKETS */}
        <div className="sidebar-category-title">Tickets</div>
        <Link 
          to="/tickets/activos" 
          className={`sidebar-link ${location.pathname.includes('/tickets/activos') ? 'active' : ''}`}
        >
          Tickets Activos
        </Link>

        {esMunicipalOrAdmin && (
          <Link 
            to="/tickets/cerrados" 
            className={`sidebar-link ${location.pathname.includes('/tickets/cerrados') ? 'active' : ''}`}
          >
            Historial Cerrados
          </Link>
        )}

        {esSupervisor && (
          <Link 
            to="/supervisor/tickets" 
            className={`sidebar-link ${location.pathname.includes('/supervisor/tickets') ? 'active' : ''}`}
          >
            Tickets de Empresa
          </Link>
        )}

        {/* CATEGORÍA: OBSERVACIONES */}
        <div className="sidebar-category-title">Observaciones</div>
        {esMunicipalOrAdmin ? (
          <Link 
            to="/observaciones/pendientes" 
            className={`sidebar-link ${location.pathname.includes('/observaciones/pendientes') ? 'active' : ''}`}
          >
            Observaciones Terreno
          </Link>
        ) : (
          <span className="sidebar-link" style={{ opacity: 0.5, cursor: 'not-allowed', fontSize: '0.8rem' }}>
            Sin acceso a módulo
          </span>
        )}

        {/* CATEGORÍA: REGISTROS (Exclusivo Administradores) */}
        {esAdmin && (
          <>
            <div className="sidebar-category-title">Registros</div>
            <Link 
              to="/empresas/nueva" 
              className={`sidebar-link ${location.pathname.includes('/empresas/nueva') ? 'active' : ''}`}
            >
              Registrar Empresa
            </Link>

            <Link 
              to="/contratos/nuevo" 
              className={`sidebar-link ${location.pathname.includes('/contratos/nuevo') ? 'active' : ''}`}
            >
              Registrar Contrato
            </Link>

            <Link 
              to="/usuarios/nuevo" 
              className={`sidebar-link ${location.pathname.includes('/usuarios/nuevo') ? 'active' : ''}`}
            >
              Registrar Usuario
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-user-name">{usuario?.nombre || 'Usuario'}</span>
        <button onClick={handleLogout} className="sidebar-logout">Cerrar Sesión</button>
      </div>
    </aside>
  );
}
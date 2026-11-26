import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserProfileModal from './UserProfile/UserProfile';
import './Navbar.css';

type CategoriaId = 'tickets' | 'observaciones' | 'usuarios' | 'registros';

function obtenerCategoriaPorRuta(pathname: string): CategoriaId | null {
  if (
    pathname.includes('/tickets/activos') ||
    pathname.includes('/tickets/cerrados') ||
    pathname.includes('/supervisor/tickets') ||
    pathname.startsWith('/tickets/')
  ) {
    return 'tickets';
  }
  if (pathname.includes('/observaciones/')) {
    return 'observaciones';
  }
  if (pathname === '/usuarios' || pathname.includes('/usuarios/nuevo')) {
    return 'usuarios';
  }
  if (
    pathname === '/empresas' ||
    pathname.includes('/empresas/nueva') ||
    pathname.includes('/contratos/nuevo')
  ) {
    return 'registros';
  }
  return null;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [perfilAbierto, setPerfilAbierto] = useState<boolean>(false);
  const [categoriaAbierta, setCategoriaAbierta] = useState<CategoriaId | null>(() =>
    obtenerCategoriaPorRuta(location.pathname)
  );

  useEffect(() => {
    const categoriaActual = obtenerCategoriaPorRuta(location.pathname);
    if (categoriaActual) {
      setCategoriaAbierta(categoriaActual);
    }
  }, [location.pathname]);

  const toggleCategoria = (id: CategoriaId) => {
    setCategoriaAbierta((prev) => (prev === id ? null : id));
  };

  const handleSeleccionarEnlace = (id: CategoriaId) => {
    setCategoriaAbierta(id);
  };

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  const esMunicipalOrAdmin = ['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol);
  const esAdmin = ['administrador', 'admin'].includes(rol);
  const esSupervisor = rol.includes('supervisor');

  const nombreUsuario = usuario?.nombre || 'Usuario';
  const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">GTFC-Nacimiento</span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {/* OPCIÓN DIRECTA: PANEL PRINCIPAL */}
          <div className="sidebar-category">
            <Link
              to="/dashboard"
              onClick={() => setCategoriaAbierta(null)}
              className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <span className="sidebar-link-dot" aria-hidden="true" />
              <span>Panel Principal</span>
            </Link>
          </div>

          {/* CATEGORÍA: TICKETS */}
          <div className="sidebar-category">
            <button
              type="button"
              className={`sidebar-category-btn ${categoriaAbierta === 'tickets' ? 'is-open' : ''}`}
              onClick={() => toggleCategoria('tickets')}
              aria-expanded={categoriaAbierta === 'tickets'}
            >
              <span>Tickets</span>
              <span className="sidebar-category-chevron" aria-hidden="true">▾</span>
            </button>

            {categoriaAbierta === 'tickets' && (
              <div className="sidebar-category-items">
                <Link
                  to="/tickets/activos"
                  onClick={() => handleSeleccionarEnlace('tickets')}
                  className={`sidebar-link ${location.pathname.includes('/tickets/activos') ? 'active' : ''}`}
                >
                  <span className="sidebar-link-dot" aria-hidden="true" />
                  <span>Tickets Activos</span>
                </Link>

                {esMunicipalOrAdmin && (
                  <Link
                    to="/tickets/cerrados"
                    onClick={() => handleSeleccionarEnlace('tickets')}
                    className={`sidebar-link ${location.pathname.includes('/tickets/cerrados') ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Historial Cerrados</span>
                  </Link>
                )}

                {esSupervisor && (
                  <Link
                    to="/supervisor/tickets"
                    onClick={() => handleSeleccionarEnlace('tickets')}
                    className={`sidebar-link ${location.pathname.includes('/supervisor/tickets') ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Tickets de Empresa</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CATEGORÍA: OBSERVACIONES */}
          <div className="sidebar-category">
            <button
              type="button"
              className={`sidebar-category-btn ${categoriaAbierta === 'observaciones' ? 'is-open' : ''}`}
              onClick={() => toggleCategoria('observaciones')}
              aria-expanded={categoriaAbierta === 'observaciones'}
            >
              <span>Observaciones</span>
              <span className="sidebar-category-chevron" aria-hidden="true">▾</span>
            </button>

            {categoriaAbierta === 'observaciones' && (
              <div className="sidebar-category-items">
                {esMunicipalOrAdmin ? (
                  <Link
                    to="/observaciones/pendientes"
                    onClick={() => handleSeleccionarEnlace('observaciones')}
                    className={`sidebar-link ${location.pathname.includes('/observaciones/pendientes') ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Observaciones Terreno</span>
                  </Link>
                ) : (
                  <span className="sidebar-link sidebar-link--disabled">
                    Sin acceso a módulo
                  </span>
                )}
              </div>
            )}
          </div>

          {/* CATEGORÍA: GESTIÓN USUARIOS (Exclusivo Administradores) */}
          {esAdmin && (
            <div className="sidebar-category">
              <button
                type="button"
                className={`sidebar-category-btn ${categoriaAbierta === 'usuarios' ? 'is-open' : ''}`}
                onClick={() => toggleCategoria('usuarios')}
                aria-expanded={categoriaAbierta === 'usuarios'}
              >
                <span>Gestión Usuarios</span>
                <span className="sidebar-category-chevron" aria-hidden="true">▾</span>
              </button>

              {categoriaAbierta === 'usuarios' && (
                <div className="sidebar-category-items">
                  <Link
                    to="/usuarios"
                    onClick={() => handleSeleccionarEnlace('usuarios')}
                    className={`sidebar-link ${location.pathname === '/usuarios' ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Lista Usuarios</span>
                  </Link>

                  <Link
                    to="/usuarios/nuevo"
                    onClick={() => handleSeleccionarEnlace('usuarios')}
                    className={`sidebar-link ${location.pathname === '/usuarios/nuevo' ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Registrar Usuario</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* CATEGORÍA: GESTIÓN EMPRESAS (Exclusivo Administradores) */}
          {esAdmin && (
            <div className="sidebar-category">
              <button
                type="button"
                className={`sidebar-category-btn ${categoriaAbierta === 'registros' ? 'is-open' : ''}`}
                onClick={() => toggleCategoria('registros')}
                aria-expanded={categoriaAbierta === 'registros'}
              >
                <span>Gestión Empresas</span>
                <span className="sidebar-category-chevron" aria-hidden="true">▾</span>
              </button>

              {categoriaAbierta === 'registros' && (
                <div className="sidebar-category-items">
                  <Link
                    to="/empresas"
                    onClick={() => handleSeleccionarEnlace('registros')}
                    className={`sidebar-link ${location.pathname === '/empresas' ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Lista Empresas</span>
                  </Link>

                  <Link
                    to="/empresas/nueva"
                    onClick={() => handleSeleccionarEnlace('registros')}
                    className={`sidebar-link ${location.pathname === '/empresas/nueva' ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Registrar Empresa</span>
                  </Link>

                  <Link
                    to="/contratos/nuevo"
                    onClick={() => handleSeleccionarEnlace('registros')}
                    className={`sidebar-link ${location.pathname === '/contratos/nuevo' ? 'active' : ''}`}
                  >
                    <span className="sidebar-link-dot" aria-hidden="true" />
                    <span>Registrar Contrato</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={() => setPerfilAbierto(true)}
            className="sidebar-user-card sidebar-user-trigger"
            title="Ver datos de perfil"
          >
            <div className="sidebar-user-avatar" aria-hidden="true">
              {inicialUsuario}
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">{nombreUsuario}</span>
              {usuario?.email && <span className="sidebar-user-email">{usuario.email}</span>}
            </div>
          </button>

          <button type="button" onClick={handleLogout} className="sidebar-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <UserProfileModal
        isOpen={perfilAbierto}
        onClose={() => setPerfilAbierto(false)}
        usuarioInicial={usuario}
      />
    </>
  );
}

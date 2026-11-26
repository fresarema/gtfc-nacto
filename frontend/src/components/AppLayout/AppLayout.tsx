import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import Icon from '../Icon/Icon';
import './AppLayout.css';

interface AppLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Botones propios de la vista; se muestran en la barra superior */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Estructura común de las vistas autenticadas:
 * barra lateral + barra superior fija + contenido.
 */
export default function AppLayout({ title, subtitle, actions, children }: AppLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;

  // Al navegar, el menú móvil se cierra solo
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="app-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="app-content">
        <header className="app-header">
          <div className="app-header-title-group">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="icon-btn app-header-menu"
              aria-label="Abrir menú"
            >
              <Icon name="menu" />
            </button>
            <div className="app-header-titles">
              <h1 className="app-header-title">{title}</h1>
              {subtitle && <p className="app-header-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="app-header-actions">
            {actions}
            <ThemeToggle />
            <span className="avatar app-header-avatar" aria-hidden="true">
              {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

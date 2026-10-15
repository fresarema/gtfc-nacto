import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loadingRole, setLoadingRole] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoadingRole(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        
        if (token) {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };
          const res = await fetch(`${API_BASE_URL}/api/auth/profile/`, { headers });
          if (res.ok) {
            const perfil = await res.json();
            const rolApi = perfil.rol || perfil.role || perfil.tipo || perfil.tipo_usuario || '';
            setUserRole(String(rolApi).toLowerCase().trim());
            setLoadingRole(false);
            return;
          }
        }

        const roleStorage = localStorage.getItem('role') || localStorage.getItem('rol') || '';
        setUserRole(roleStorage.toLowerCase().trim());
      } catch (err) {
        console.error("Error al obtener el rol en Sidebar:", err);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchUserRole();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const isSupervisor = 
    userRole.includes('supervisor') || 
    userRole.includes('extern') || 
    userRole.includes('contratist') ||
    userRole.includes('empresa');

  const isAdmin = userRole.includes('administrador') || userRole.includes('admin');

  return (
    <>
      {/* 🍔 Botón Hamburguesa móvil */}
      <button 
        className={styles.hamburgerButton} 
        onClick={toggleMenu}
        aria-label="Menú de navegación"
      >
        ☰
      </button>

      {/* Fondo oscuro traslúcido para móvil */}
      {isOpen && <div className={styles.backdrop} onClick={closeMenu} />}

      {/* Menú Lateral */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.brand}>
          <span>Fiscalización</span>
          <button className={styles.closeButton} onClick={closeMenu}>&times;</button>
        </div>

        <nav className={styles.nav}>
          {!loadingRole && (
            <>
              {/* 🟢 Habilitado tanto para personal municipal como para el supervisor */}
              <NavLink 
                to="/bandeja-municipal" 
                className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                onClick={closeMenu}
              >
                {isSupervisor ? 'Panel de Control' : 'Bandeja Municipal'}
              </NavLink>

              {/* NUEVA OPCIÓN: Conversión de Observaciones a Tickets (Exclusiva municipal) */}
              {!isSupervisor && (
                <NavLink 
                  to="/observaciones-pendientes" 
                  className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                  onClick={closeMenu}
                >
                  Observaciones a Tickets
                </NavLink>
              )}

              {/* Opción de Subsanación */}
              <NavLink 
                to="/subsanacion" 
                className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                onClick={closeMenu}
              >
                Subsanación de Tickets
              </NavLink>

              {!isSupervisor && (
                <NavLink 
                  to="/historial-tickets" 
                  className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                  onClick={closeMenu}
                >
                  Historial de Tickets
                </NavLink>
              )}

              {/* Opción exclusiva para el rol de Administrador */}
              {isAdmin && (
                <NavLink 
                  to="/crear-usuario" 
                  className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                  onClick={closeMenu}
                >
                  Crear Usuario
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
          <span className={styles.versionText}>NosequeponerasiHola</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
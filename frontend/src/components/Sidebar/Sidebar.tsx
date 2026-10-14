import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtenemos el rol guardado al iniciar sesión
    const role = localStorage.getItem('role') || '';
    setUserRole(role.toLowerCase());
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  // Verificamos si es supervisor (puedes ajustar el nombre según backend, ej: 'supervisor', 'empresa', etc.)
  const isSupervisor = userRole === 'supervisor' || userRole === 'empresa';

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
          {/* Opciones exclusivas para personal municipal / administrativo (Ocultas para Supervisor) */}
          {!isSupervisor && (
            <>
              <NavLink 
                to="/bandeja-municipal" 
                className={({ isActive }) => isActive ? `${styles.link} ${styles.activeLink}` : styles.link}
                onClick={closeMenu}
              >
                Bandeja Municipal
              </NavLink>

            </>
          )}

          {/* Opción permitida para el Supervisor: Subsanación */}
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
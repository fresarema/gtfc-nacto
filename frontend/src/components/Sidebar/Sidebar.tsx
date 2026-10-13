import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        GTFC NACIMIENTO
      </div>
      
      <nav className={styles.nav}>
        <NavLink 
          to="/bandeja-municipal" 
          className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`}
          end
        >
          Bandeja Principal
        </NavLink>

        <NavLink 
          to="/solicitudes-validacion" 
          className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`}
        >
          Solicitudes de Validación
        </NavLink>

        <NavLink 
          to="/historial-tickets" 
          className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`}
        >
          Historial de Tickets
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <span>Inspector Panel v1.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
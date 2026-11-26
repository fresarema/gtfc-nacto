import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FiscalizadorHome.css';
import fondo from '../../assets/whiteBG.png';

export default function FiscalizadorHome() {
  const navigate = useNavigate();

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/login', { replace: true });
  };

  return (
    <div 
      className="fiscalizador-layout"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="fiscalizador-card">
        <header className="fiscalizador-header">
          <span className="fiscalizador-brand">gtfc-nacto</span>
          <h1 className="fiscalizador-title">Portal de Fiscalización</h1>
          <p className="fiscalizador-subtitle">
            Bienvenido, <strong>{usuario?.nombre || 'Fiscalizador'}</strong> ({usuario?.rol || 'Municipal'})
          </p>
        </header>

        <div className="fiscalizador-actions-grid">
          {/* Botón 1: Listar Mis Observaciones (Ruta corregida) */}
          <button 
            onClick={() => navigate('/fiscalizador/observaciones')} 
            className="fiscalizador-btn btn-listar"
          >
            <span className="btn-text">
              <strong>Listar Observaciones</strong>
              <small>Ver registros propios de terreno</small>
            </span>
          </button>

          {/* Botón 2: Crear Nueva Observación */}
          <button 
            onClick={() => navigate('/observaciones/nueva')} 
            className="fiscalizador-btn btn-crear"
          >
            <span className="btn-text">
              <strong>Nueva Observación</strong>
              <small>Registrar una nueva incidencia</small>
            </span>
          </button>

          {/* Botón 3: Cerrar Sesión */}
          <button 
            onClick={handleLogout} 
            className="fiscalizador-btn btn-logout"
          >
            <span className="btn-text">
              <strong>Cerrar Sesión</strong>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
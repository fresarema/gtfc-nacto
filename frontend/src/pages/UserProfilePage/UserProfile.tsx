import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import type { PerfilUsuarioData } from '../../components/UserProfile/UserProfile';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const navigate = useNavigate();
  const userDataString = localStorage.getItem('user_data');
  const inicial: PerfilUsuarioData | null = userDataString ? JSON.parse(userDataString) : null;

  const [perfil, setPerfil] = useState<PerfilUsuarioData | null>(inicial);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    setCargando(true);
    api
      .get('/auth/profile/', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data) {
          const combinado = { ...(inicial || {}), ...res.data };
          setPerfil(combinado);
          localStorage.setItem('user_data', JSON.stringify(combinado));
        }
      })
      .finally(() => setCargando(false));
  }, []);

  const nombreCompleto =
    [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ') || 'Usuario';
  const empresaAsociada =
    perfil?.empresa_nombre ||
    perfil?.empresa_asignada ||
    perfil?.razon_social ||
    (perfil?.id_empresa ? `Empresa #${perfil.id_empresa}` : 'No asignada');

  return (
    <div className="user-profile-layout">
      <Navbar />
      <main className="user-profile-main">
        <div className="user-profile-card">
          <header className="user-profile-header">
            <div>
              <h1 className="user-profile-title">Perfil de Usuario</h1>
              <p className="user-profile-subtitle">
                Información asociada a tu cuenta y permisos activos
              </p>
            </div>
            <span className="user-profile-role-badge">{perfil?.rol || 'Usuario'}</span>
          </header>

          {cargando && <p className="user-profile-loading">Sincronizando perfil...</p>}

          <div className="user-profile-details">
            <div className="user-profile-item">
              <span className="item-label">Nombre completo</span>
              <span className="item-value">{nombreCompleto}</span>
            </div>

            <div className="user-profile-item">
              <span className="item-label">Correo electrónico</span>
              <span className="item-value">{perfil?.email || 'No disponible'}</span>
            </div>

            <div className="user-profile-item">
              <span className="item-label">Rol</span>
              <span className="item-value">{perfil?.rol || 'No especificado'}</span>
            </div>

            <div className="user-profile-item">
              <span className="item-label">Empresa asociada</span>
              <span className="item-value">{empresaAsociada}</span>
            </div>
          </div>

          <div className="user-profile-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-volver-perfil"
            >
              ← Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
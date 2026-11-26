import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import './UserProfile.css';

export interface PerfilUsuarioData {
  id_usuario?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  id_empresa?: number | null;
  empresa_nombre?: string | null;
  empresa_asignada?: string | null;
  razon_social?: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioInicial?: PerfilUsuarioData | null;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  usuarioInicial,
}: UserProfileModalProps) {
  const [perfil, setPerfil] = useState<PerfilUsuarioData | null>(usuarioInicial || null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [errorSync, setErrorSync] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setPerfil(usuarioInicial || null);
    setErrorSync('');

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    let activo = true;
    setCargando(true);

    api
      .get('/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!activo || !res.data) return;
        const actualizado: PerfilUsuarioData = {
          ...(usuarioInicial || {}),
          ...res.data,
        };
        setPerfil(actualizado);
        localStorage.setItem('user_data', JSON.stringify(actualizado));
      })
      .catch(() => {
        if (activo) {
          setErrorSync('Mostrando datos de sesión local.');
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [isOpen, usuarioInicial]);

  if (!isOpen) return null;

  const nombreLimpio = (perfil?.nombre || '').trim();
  const apellidoLimpio = (perfil?.apellido || '').trim();
  const nombreCompleto =
    [nombreLimpio, apellidoLimpio].filter(Boolean).join(' ') || 'Usuario';
  const inicial = nombreCompleto.charAt(0).toUpperCase();
  const empresaAsociada =
    perfil?.empresa_nombre ||
    perfil?.empresa_asignada ||
    perfil?.razon_social ||
    (perfil?.id_empresa ? `Empresa #${perfil.id_empresa}` : 'No asignada');

  return (
    <div className="profile-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <div className="profile-modal-identity">
            <div className="profile-modal-avatar" aria-hidden="true">
              {inicial}
            </div>
            <div>
              <h2 className="profile-modal-title">{nombreCompleto}</h2>
              <span className="profile-modal-role">{perfil?.rol || 'Usuario'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="profile-modal-close"
            aria-label="Cerrar perfil"
          >
            ✕
          </button>
        </div>

        {cargando && <div className="profile-modal-status">Actualizando datos...</div>}
        {errorSync && <div className="profile-modal-note">{errorSync}</div>}

        <div className="profile-modal-grid">
          <div className="profile-field-box">
            <span className="profile-field-label">Nombre Completo</span>
            <span className="profile-field-value">{nombreLimpio || 'No disponible'}</span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Apellido</span>
            <span className="profile-field-value">{apellidoLimpio || 'No disponible'}</span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Correo electrónico</span>
            <span className="profile-field-value">{perfil?.email || 'No disponible'}</span>
          </div>

          <div className="profile-field-box">
            <span className="profile-field-label">Rol del sistema</span>
            <span className="profile-field-value">{perfil?.rol || 'No especificado'}</span>
          </div>

          <div className="profile-field-box profile-field-box--full">
            <span className="profile-field-label">Empresa asociada</span>
            <span className="profile-field-value">{empresaAsociada}</span>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button type="button" onClick={onClose} className="profile-btn-close">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
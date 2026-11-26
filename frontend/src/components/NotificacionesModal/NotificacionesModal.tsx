import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './NotificacionesModal.css';

export interface NotificacionItem {
  id_notificacion: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  id_ticket: number | null;
  cod_consulta_externa: string | null;
  id_observacion: number | null;
  fecha: string | null;
  hora: string | null;
  fecha_hora: string | null;
}

type FiltroEstadoLectura = 'todas' | 'no_leidas' | 'leidas';

interface NotificacionesModalProps {
  pollingIntervalMs?: number;
}

export default function NotificacionesModal({
  pollingIntervalMs = 30000,
}: NotificacionesModalProps) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [noLeidas, setNoLeidas] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoLectura>('no_leidas');
  const [cargando, setCargando] = useState<boolean>(false);
  const [marcandoTodas, setMarcandoTodas] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const cargarNotificaciones = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setError('');
    try {
      const res = await api.get('/notificaciones/', {
        headers: getAuthHeaders(),
        params: {
          solo_no_leidas: 'false',
          limite: 50,
        },
      });
      setNotificaciones(Array.isArray(res.data?.notificaciones) ? res.data.notificaciones : []);
      setNoLeidas(typeof res.data?.no_leidas === 'number' ? res.data.no_leidas : 0);
    } catch (err: unknown) {
      const statusCode = (err as { response?: { status?: number } })?.response?.status;
      if (statusCode === 403) {
        setNotificaciones([]);
        setNoLeidas(0);
      } else if (!silencioso) {
        setError('No se pudieron cargar las notificaciones.');
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones(true);
    if (!pollingIntervalMs) return;

    const timer = window.setInterval(() => {
      cargarNotificaciones(true);
    }, pollingIntervalMs);

    return () => window.clearInterval(timer);
  }, [cargarNotificaciones, pollingIntervalMs]);

  const notificacionesFiltradas = useMemo(() => {
    if (filtroEstado === 'no_leidas') {
      return notificaciones.filter((n) => !n.leida);
    }
    if (filtroEstado === 'leidas') {
      return notificaciones.filter((n) => Boolean(n.leida));
    }
    return notificaciones;
  }, [notificaciones, filtroEstado]);

  const totalLeidas = useMemo(
    () => notificaciones.filter((n) => Boolean(n.leida)).length,
    [notificaciones]
  );

  const handleAbrirModal = () => {
    setAbierto(true);
    cargarNotificaciones(false);
  };

  const handleCerrarModal = () => {
    if (marcandoTodas) return;
    setAbierto(false);
  };

  const marcarComoLeida = async (notif: NotificacionItem) => {
    if (notif.leida) return;
    try {
      const res = await api.patch(
        `/notificaciones/${notif.id_notificacion}/leer/`,
        {},
        { headers: getAuthHeaders() }
      );
      setNotificaciones((prev) =>
        prev.map((item) =>
          item.id_notificacion === notif.id_notificacion ? { ...item, leida: true } : item
        )
      );
      if (typeof res.data?.no_leidas === 'number') {
        setNoLeidas(res.data.no_leidas);
      } else {
        setNoLeidas((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  const handleClickNotificacion = async (notif: NotificacionItem) => {
    await marcarComoLeida(notif);
    setAbierto(false);

    if (notif.id_ticket) {
      navigate(`/tickets/${notif.id_ticket}`);
    } else if (notif.id_observacion) {
      navigate('/observaciones/pendientes');
    }
  };

  const handleMarcarTodasLeidas = async () => {
    if (noLeidas === 0 || marcandoTodas) return;
    setMarcandoTodas(true);
    try {
      await api.post('/notificaciones/leer-todas/', {}, { headers: getAuthHeaders() });
      setNoLeidas(0);
      setNotificaciones((prev) => prev.map((item) => ({ ...item, leida: true })));
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    } finally {
      setMarcandoTodas(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAbrirModal}
        className="notif-bell-btn"
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ''}`}
        title="Ver notificaciones"
      >
        <svg
          className="notif-bell-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {noLeidas > 0 && (
          <span className="notif-badge-count">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="notif-modal-backdrop"
          onClick={handleCerrarModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-modal-titulo"
        >
          <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div>
                <h3 id="notif-modal-titulo" className="notif-modal-title">
                  Notificaciones
                </h3>
                <p className="notif-modal-subtitle">
                  {noLeidas > 0
                    ? `Tienes ${noLeidas} notificación${noLeidas === 1 ? '' : 'es'} sin leer`
                    : 'Estás al día con tus notificaciones'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCerrarModal}
                className="notif-modal-close"
                aria-label="Cerrar modal de notificaciones"
              >
                ✕
              </button>
            </div>

            <div className="notif-modal-toolbar">
              <div className="notif-filter-group" role="group" aria-label="Filtrar notificaciones">
                 <button
                  type="button"
                  onClick={() => setFiltroEstado('no_leidas')}
                  className={`notif-filter-chip ${filtroEstado === 'no_leidas' ? 'is-active' : ''}`}
                >
                  No leídas ({noLeidas})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('leidas')}
                  className={`notif-filter-chip ${filtroEstado === 'leidas' ? 'is-active' : ''}`}
                >
                  Leídas ({totalLeidas})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('todas')}
                  className={`notif-filter-chip ${filtroEstado === 'todas' ? 'is-active' : ''}`}
                >
                  Todas ({notificaciones.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarcarTodasLeidas}
                className="notif-mark-all-btn"
                disabled={noLeidas === 0 || marcandoTodas}
              >
                {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            </div>

            {error && <div className="notif-modal-error">{error}</div>}

            <div className="notif-modal-body">
              {cargando ? (
                <div className="notif-empty-state">Cargando notificaciones...</div>
              ) : notificacionesFiltradas.length === 0 ? (
                <div className="notif-empty-state">
                  {filtroEstado === 'no_leidas'
                    ? 'No tienes notificaciones no leídas.'
                    : filtroEstado === 'leidas'
                      ? 'No tienes notificaciones leídas.'
                      : 'No hay notificaciones registradas.'}
                </div>
              ) : (
                <ul className="notif-list">
                  {notificacionesFiltradas.map((notif) => (
                    <li
                      key={notif.id_notificacion}
                      className={`notif-item ${notif.leida ? 'is-read' : 'is-unread'}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleClickNotificacion(notif)}
                        className="notif-item-btn"
                      >
                        <div className="notif-item-top">
                          <span className="notif-item-tag">
                            {notif.cod_consulta_externa
                              ? `Ticket #${notif.cod_consulta_externa}`
                              : notif.id_observacion
                                ? `Observación #${notif.id_observacion}`
                                : 'Sistema'}
                          </span>
                          <span className="notif-item-time">
                            {notif.fecha_hora ||
                              [notif.fecha, notif.hora].filter(Boolean).join(' ') ||
                              ''}
                          </span>
                        </div>

                        <p className="notif-item-message">{notif.mensaje}</p>
                      </button>

                      {!notif.leida && (
                        <button
                          type="button"
                          onClick={() => marcarComoLeida(notif)}
                          className="notif-item-read-btn"
                          title="Marcar como leída"
                        >
                          Leída
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
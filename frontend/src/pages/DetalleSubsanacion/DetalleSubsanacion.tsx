import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetalleSubsanacion.module.css';

interface Evidencia {
  id_evidencia?: number;
  url_foto?: string;
  url?: string;
  descripcion?: string;
  descripcion_solucion?: string;
  fecha_carga?: string;
}

interface TicketSubsanacion {
  id?: number;
  id_ticket: number;
  id_observacion?: number;
  cod_consulta_externa?: string;
  descripcion_ticket?: string;
  descripcion?: string;
  estado: string;
  motivo_rechazo?: string;
  evidencia?: Evidencia | null;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const DetalleSubsanacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<TicketSubsanacion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  // Formulario supervisor (subir evidencia)
  const [descripcionSolucion, setDescripcionSolucion] = useState<string>('');
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState<boolean>(false);

  // Formulario auditoría municipal (aprobar/rechazar)
  const [comentarioAuditoria, setComentarioAuditoria] = useState<string>('');
  const [auditando, setAuditando] = useState<boolean>(false);

  useEffect(() => {
    fetchUserDataAndTicket();
  }, [id]);

  const fetchUserDataAndTicket = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Obtener perfil del usuario logueado para saber su rol
      const resPerfil = await fetch(`${API_BASE_URL}/api/auth/profile/`, { headers });
      if (resPerfil.ok) {
        const perfilData = await resPerfil.json();
        setUserRole(perfilData.rol || '');
      }

      // Obtener detalle individual del ticket directamente si el backend lo soporta, o buscar en la lista
      let ticketEncontrado: TicketSubsanacion | undefined;
      const resDetail = await fetch(`${API_BASE_URL}/api/tickets/${id}/`, { headers });
      if (resDetail.ok) {
        ticketEncontrado = await resDetail.json();
      } else {
        // Fallback a las bandejas
        const resList = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
        if (resList.ok) {
          const dataList = await resList.json();
          const lista: TicketSubsanacion[] = Array.isArray(dataList) ? dataList : (dataList.results || []);
          ticketEncontrado = lista.find((t) => {
            const realId = t.id_ticket ?? t.id_observacion ?? t.id;
            return String(realId) === String(id);
          });
        }
      }

      if (!ticketEncontrado) {
        throw new Error(`El ticket #${id} no existe o no está disponible.`);
      }

      setTicket(ticketEncontrado);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la información.');
    } finally {
      setLoading(false);
    }
  };

  // Acción del Supervisor: Enviar evidencia
  const handleSubirEvidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoEvidencia) {
      alert('Por favor adjunta una fotografía de evidencia.');
      return;
    }

    try {
      setSubiendo(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const targetId = ticket?.id_ticket ?? ticket?.id_observacion ?? ticket?.id ?? id;

      const formData = new FormData();
      formData.append('descripcion_solucion', descripcionSolucion);
      formData.append('foto_evidencia', archivoEvidencia);
      formData.append('estado', 'En Revisión');

      const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/api/tickets/${targetId}/subsanar/`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.mensaje || errData.error || 'Error al enviar evidencia.');
      }

      alert('¡Evidencia enviada con éxito! Queda a la espera de validación municipal.');
      fetchUserDataAndTicket();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubiendo(false);
    }
  };

  // Acción del Usuario Municipal: Aprobar o Rechazar
  const handleAuditarTicket = async (decision: 'Cerrado' | 'Rechazado') => {
    if (!comentarioAuditoria.trim()) {
      alert('Por favor ingresa un comentario u observación para la auditoría.');
      return;
    }

    try {
      setAuditando(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const targetId = ticket?.id_ticket ?? ticket?.id_observacion ?? ticket?.id ?? id;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/api/tickets/auditar/${targetId}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          estado: decision,
          comentario: comentarioAuditoria
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.mensaje || errData.error || 'Error al procesar la auditoría.');
      }

      alert(`Ticket ${decision === 'Cerrado' ? 'aprobado y cerrado' : 'rechazado y devuelto al supervisor'} con éxito.`);
      navigate('/subsanacion');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setAuditando(false);
    }
  };

  if (loading) return <div className={styles.container}>Cargando detalle de subsanación...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!ticket) return null;

  const ticketIdDisplay = ticket.id_ticket ?? ticket.id_observacion ?? ticket.id ?? id;
  const estadoNorm = (ticket.estado || '').toLowerCase();
  
  const esMunicipal = ['usuario municipal', 'municipal', 'administrador', 'admin'].includes(userRole.toLowerCase());
  const esSupervisor = ['supervisor de empresa externa', 'supervisor'].includes(userRole.toLowerCase());

  const fotoEvidenciaUrl = ticket.evidencia ? (ticket.evidencia.url_foto || ticket.evidencia.url) : null;
  const renderFotoEvidencia = fotoEvidenciaUrl
    ? (fotoEvidenciaUrl.startsWith('http') ? fotoEvidenciaUrl : `${API_BASE_URL}${fotoEvidenciaUrl.startsWith('/') ? '' : '/'}${fotoEvidenciaUrl}`)
    : null;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/subsanacion')} className={styles.backButton}>
        ← Volver a Subsanaciones
      </button>

      <div className={styles.card}>
        <div className={styles.headerRow}>
          <h2>Revisión de Subsanación - Ticket #{ticketIdDisplay}</h2>
          <span className={`${styles.badge} ${styles[estadoNorm]}`}>{ticket.estado}</span>
        </div>

        {/* ALERTA VISIBLE DEL MOTIVO DE RECHAZO MUNICIPAL */}
        {ticket.motivo_rechazo && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#991b1b' }}>
            <strong>Motivo del Rechazo Municipal:</strong>
            <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{ticket.motivo_rechazo}</p>
          </div>
        )}

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Instrucciones / Descripción Inicial</label>
          <p style={{ marginTop: '4px', color: '#1e293b' }}>{ticket.descripcion_ticket || ticket.descripcion || 'Sin instrucciones'}</p>
        </div>

        {/* Sección de Evidencia Enviada (Visible si existe) */}
        {ticket.evidencia && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>Evidencia Enviada por el Supervisor</h3>
            {renderFotoEvidencia && (
              <img 
                src={renderFotoEvidencia} 
                alt="Evidencia Subsanada" 
                style={{ maxWidth: '350px', borderRadius: '6px', marginBottom: '0.75rem', display: 'block', border: '1px solid #cbd5e1' }}
              />
            )}
            <p style={{ color: '#14532d', margin: '4px 0' }}>
              <strong>Descripción de los trabajos:</strong> {ticket.evidencia.descripcion_solucion || ticket.evidencia.descripcion || 'Sin detalle'}
            </p>
          </div>
        )}

        {/* VISTA PARA EL USUARIO MUNICIPAL: Auditar (Aprobar / Rechazar) */}
        {esMunicipal && estadoNorm === 'en revisión' && (
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem', background: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <h3 style={{ marginBottom: '1rem', color: '#92400e', marginTop: 0 }}>Auditoría y Validación Municipal</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#78350f' }}>
                Comentario de Aprobación o Motivo de Rechazo
              </label>
              <textarea
                rows={3}
                value={comentarioAuditoria}
                onChange={(e) => setComentarioAuditoria(e.target.value)}
                placeholder="Ingresa los detalles de la auditoría..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                disabled={auditando}
                onClick={() => handleAuditarTicket('Cerrado')}
                style={{ background: '#16a34a', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                {auditando ? 'Procesando...' : 'Aprobar y Cerrar Ticket'}
              </button>

              <button 
                type="button"
                disabled={auditando}
                onClick={() => handleAuditarTicket('Rechazado')}
                style={{ background: '#dc2626', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                {auditando ? 'Procesando...' : 'Rechazar y Devolver'}
              </button>
            </div>
          </div>
        )}

        {/* VISTA PARA EL SUPERVISOR: Subir / Modificar Evidencia */}
        {esSupervisor && (estadoNorm === 'pendiente' || estadoNorm === 'rechazado' || estadoNorm === 'abierto') && (
          <form onSubmit={handleSubirEvidencia} style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Cargar Evidencia Corregida de Subsanación</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Descripción de los trabajos realizados
              </label>
              <textarea
                rows={3}
                value={descripcionSolucion}
                onChange={(e) => setDescripcionSolucion(e.target.value)}
                placeholder="Detalla las acciones tomadas para corregir las observaciones..."
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Fotografía de Evidencia
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoEvidencia(e.target.files ? e.target.files[0] : null)}
                required
                style={{ display: 'block', width: '100%' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={subiendo} 
              style={{ background: '#01497c', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {subiendo ? 'Enviando Evidencia...' : 'Enviar Evidencia Corregida'}
            </button>
          </form>
        )}

        {/* Mensajes informativos de estado */}
        {!esMunicipal && !esSupervisor && (
          <div style={{ padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', marginTop: '1rem' }}>
            Estado actual del ticket: <strong>{ticket.estado}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleSubsanacion;
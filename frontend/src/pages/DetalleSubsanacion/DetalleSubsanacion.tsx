import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TicketHeader } from '../../components/ticket-detalle/TicketHeader';
import { TicketInfoCard } from '../../components/ticket-detalle/TicketInfoCard';
import { EvidenciaViewer } from '../../components/ticket-detalle/EvidenciaViewer';
import { FormularioEvidencia } from './FormularioEvidencia';
import { FormularioAuditoria } from './FormularioAuditoria';

interface Evidencia {
  id_evidencia?: number;
  url_foto?: string;
  url?: string;
  descripcion?: string;
  descripcion_solucion?: string;
  fecha_carga?: string;
  [key: string]: unknown;
}

interface RechazoHistorial {
  id?: number;
  id_rechazo?: number;
  motivo?: string;
  comentario?: string;
  fecha?: string;
  fecha_rechazo?: string;
  usuario_auditor?: string;
  [key: string]: unknown;
}

interface TicketSubsanacion {
  id?: number;
  id_ticket?: number;
  id_observacion?: number;
  cod_consulta_externa?: string;
  descripcion_ticket?: string;
  descripcion?: string;
  estado: string;
  fecha_registro?: string;
  creado_por?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  fiscalizador?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  usuario_creacion?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  usuario?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  inspector?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  nombre_fiscalizador?: string;
  nombre_inspector?: string;
  ubicacion?: unknown;
  ubicacion_observacion?: unknown;
  fotografias?: string[];
  motivo_rechazo?: string;
  historial_rechazos?: RechazoHistorial[];
  rechazos?: RechazoHistorial[];
  evidencia?: Evidencia | null;
  [key: string]: unknown;
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

  const [subiendo, setSubiendo] = useState<boolean>(false);
  const [auditando, setAuditando] = useState<boolean>(false);

  const fetchUserDataAndTicket = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const resPerfil = await fetch(`${API_BASE_URL}/api/auth/profile/`, { headers });
      if (resPerfil.ok) {
        const perfilData = await resPerfil.json();
        setUserRole(perfilData.rol || '');
      }

      let ticketEncontrado: TicketSubsanacion | undefined;
      const resDetail = await fetch(`${API_BASE_URL}/api/tickets/${id}/`, { headers });
      if (resDetail.ok) {
        ticketEncontrado = await resDetail.json();
      } else {
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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al cargar la información.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUserDataAndTicket(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserDataAndTicket]);

  const handleEnviarEvidencia = async (descripcionSolucion: string, archivoEvidencia: File) => {
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
        throw new Error(typeof errData === 'object' && errData !== null && ('detail' in errData || 'mensaje' in errData || 'error' in errData) ? String((errData as { detail?: unknown; mensaje?: unknown; error?: unknown }).detail || (errData as { mensaje?: unknown }).mensaje || (errData as { error?: unknown }).error) : 'Error al enviar evidencia.');
      }

      alert('¡Evidencia enviada con éxito! Queda a la espera de validación municipal.');
      fetchUserDataAndTicket(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error al enviar evidencia.');
      }
    } finally {
      setSubiendo(false);
    }
  };

  const handleAuditarTicket = async (decision: 'Cerrado' | 'Rechazado', comentarioAuditoria: string) => {
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
        throw new Error(typeof errData === 'object' && errData !== null && ('detail' in errData || 'mensaje' in errData || 'error' in errData) ? String((errData as { detail?: unknown; mensaje?: unknown; error?: unknown }).detail || (errData as { mensaje?: unknown }).mensaje || (errData as { error?: unknown }).error) : 'Error al procesar la auditoría.');
      }

      alert(`Ticket ${decision === 'Cerrado' ? 'aprobado y cerrado' : 'rechazado y devuelto al supervisor'} con éxito.`);
      navigate('/subsanacion');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error al procesar la auditoría.');
      }
    } finally {
      setAuditando(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando detalle de subsanación...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;
  if (!ticket) return null;

  const ticketIdDisplay = Number(ticket.id_ticket ?? ticket.id_observacion ?? ticket.id ?? id);
  const estadoNorm = (ticket.estado || '').toLowerCase();
  
  const esMunicipal = ['usuario municipal', 'municipal', 'administrador', 'admin'].includes(userRole.toLowerCase());
  const esSupervisor = ['supervisor de empresa externa', 'supervisor'].includes(userRole.toLowerCase());

  const listaRechazos = ticket.historial_rechazos || ticket.rechazos || [];

  const parseUserField = (field: unknown): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && field !== null) {
      const u = field as { nombre?: unknown; username?: unknown; email?: unknown; first_name?: unknown; last_name?: unknown };
      const nombreCompleto = [u.first_name, u.last_name].filter(Boolean).join(' ');
      return String(nombreCompleto || u.nombre || u.username || u.email || '');
    }
    return '';
  };

  const nombreCreador = 
    parseUserField(ticket.creado_por) || 
    parseUserField(ticket.fiscalizador) || 
    parseUserField(ticket.usuario_creacion) || 
    parseUserField(ticket.usuario) || 
    parseUserField(ticket.inspector) || 
    ticket.nombre_fiscalizador || 
    ticket.nombre_inspector || 
    (ticket.id_observacion ? `Observación de Terreno #${ticket.id_observacion}` : 'Fiscalizador Municipal');

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <TicketHeader 
        idTicket={ticketIdDisplay} 
        codConsultaExterna={String(ticket.cod_consulta_externa || '')} 
      />

      <TicketInfoCard ticketData={ticket} />

      {/* Información del Creador / Fiscalizador */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          Creado por / Fiscalizador
        </span>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
          {nombreCreador}
        </span>
      </div>

      {/* FOTOGRAFÍAS / IMAGEN ADJUNTA DE LA OBSERVACIÓN INICIAL */}
      {ticket.fotografias && ticket.fotografias.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            Fotografía Adjunta de la Observación Inicial
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {ticket.fotografias.map((foto, index) => {
              const fotoUrl = foto.startsWith('http') ? foto : `${API_BASE_URL}${foto.startsWith('/') ? '' : '/'}${foto}`;
              return (
                <div key={index} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc' }}>
                  <a href={fotoUrl} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={fotoUrl} 
                      alt={`Evidencia inicial ${index + 1}`} 
                      style={{ maxWidth: '280px', maxHeight: '200px', objectFit: 'cover', display: 'block' }} 
                    />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HISTORIAL COMPLETO DE RECHAZOS */}
      {listaRechazos.length > 0 && (
        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '16px', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#9f1239', marginTop: 0, fontSize: '1rem', borderBottom: '1px solid #ffe4e6', paddingBottom: '8px' }}>
            Historial de Rechazos ({listaRechazos.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {listaRechazos.map((rechazo, idx) => (
              <div key={Number(rechazo.id_rechazo || rechazo.id || idx)} style={{ backgroundColor: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #f43f5e33' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                  <span>Auditor / Usuario: {String(rechazo.usuario_auditor || 'Municipalidad')}</span>
                  <span>{String(rechazo.fecha_rechazo || rechazo.fecha || 'Fecha no registrada')}</span>
                </div>
                <p style={{ margin: 0, color: '#881337', fontSize: '0.95rem' }}>
                  {String(rechazo.motivo || rechazo.comentario || 'Sin observaciones registradas')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidencia de subsanación posterior (si existe) */}
      {ticket.evidencia && (
        <EvidenciaViewer evidencia={ticket.evidencia} baseUrl={API_BASE_URL} />
      )}

      {/* Muestra formulario de auditoría municipal si corresponde */}
      {esMunicipal && estadoNorm === 'en revisión' && (
        <div style={{ marginTop: '1.5rem' }}>
          <FormularioAuditoria onAuditar={handleAuditarTicket} auditando={auditando} />
        </div>
      )}

      {/* Muestra formulario de carga de evidencia para el supervisor si corresponde */}
      {esSupervisor && ['pendiente', 'rechazado', 'abierto'].includes(estadoNorm) && (
        <div style={{ marginTop: '1.5rem' }}>
          <FormularioEvidencia onEnviar={handleEnviarEvidencia} subiendo={subiendo} />
        </div>
      )}
    </div>
  );
};

export default DetalleSubsanacion;
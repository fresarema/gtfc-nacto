import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Ajusta las rutas relativas para salir de 'pages' y entrar a 'components'
import { TicketHeader } from '../../components/ticket-detalle/TicketHeader';
import { TicketInfoCard } from '../../components/ticket-detalle/TicketInfoCard';
import { EvidenciaViewer } from '../../components/ticket-detalle/EvidenciaViewer';
import { AuditActionsForm } from '../../components/ticket-detalle/AuditActionsForm';

interface UbicacionObjeto {
  direccion?: string;
  nombre?: string;
  formatted_address?: string;
  latitud?: number;
  longitud?: number;
  text?: string;
  [key: string]: unknown;
}

interface EvidenciaData {
  id_evidencia?: number;
  url_foto?: string;
  url?: string;
  descripcion?: string;
  descripcion_solucion?: string;
  fecha_carga?: string;
  [key: string]: unknown;
}

interface TicketDetalle {
  id_ticket?: number | string;
  id_observacion?: number | string;
  cod_consulta_externa?: string;
  estado?: string;
  ubicacion?: string | UbicacionObjeto;
  ubicacion_observacion?: string | UbicacionObjeto;
  creado_por?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  fiscalizador?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  usuario_creacion?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  usuario?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  inspector?: string | { nombre?: string; username?: string; email?: string; [key: string]: unknown };
  nombre_fiscalizador?: string;
  nombre_inspector?: string;
  fotografias?: string[];
  evidencia?: EvidenciaData | null;
  [key: string]: unknown;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const DetalleTicket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticketData, setTicketData] = useState<TicketDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${API_BASE_URL}/api/tickets/${id}/`, { headers });
        if (!res.ok) throw new Error('No se pudo obtener el detalle del ticket.');

        const data = await res.json();

        // Función robusta para normalizar la ubicación y evitar [object Object]
        const parseUbicacion = (ubi: unknown): string => {
          if (!ubi) return 'Sin dirección registrada';
          if (typeof ubi === 'string') return ubi;
          if (typeof ubi === 'object' && ubi !== null) {
            const ubiObj = ubi as UbicacionObjeto;
            if (ubiObj.direccion) return String(ubiObj.direccion);
            if (ubiObj.nombre) return String(ubiObj.nombre);
            if (ubiObj.formatted_address) return String(ubiObj.formatted_address);
            if (typeof ubiObj.latitud === 'number' && typeof ubiObj.longitud === 'number') {
              return `Lat: ${ubiObj.latitud}, Lng: ${ubiObj.longitud}`;
            }
            const valoresValidos = Object.values(ubiObj).filter((val) => typeof val === 'string' || typeof val === 'number');
            if (valoresValidos.length > 0) {
              return valoresValidos.join(', ');
            }
            return ubiObj.text ? String(ubiObj.text) : JSON.stringify(ubiObj);
          }
          return String(ubi);
        };

        const ticketNormalizado: TicketDetalle = {
          ...data,
          ubicacion_observacion: parseUbicacion(data.ubicacion || data.ubicacion_observacion)
        };

        setTicketData(ticketNormalizado);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al conectar con el servidor.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetalle();
  }, [id]);

  const handleAuditar = async (nuevoEstado: 'Cerrado' | 'Rechazado', comentario: string) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/api/tickets/auditar/${id}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ estado: nuevoEstado, comentario }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(typeof errorData === 'object' && errorData !== null && 'error' in errorData ? String((errorData as { error: unknown }).error) : 'Error al procesar la auditoría.');
      }

      alert(`Ticket auditado con éxito. Estado: ${nuevoEstado}`);
      navigate('/historial-tickets');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error: ${err.message}`);
      } else {
        alert('Error al procesar la auditoría.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando detalle del ticket...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;
  if (!ticketData) return <div style={{ padding: '2rem' }}>No se encontró el ticket.</div>;

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
    parseUserField(ticketData.creado_por) || 
    parseUserField(ticketData.fiscalizador) || 
    parseUserField(ticketData.usuario_creacion) || 
    parseUserField(ticketData.usuario) || 
    parseUserField(ticketData.inspector) || 
    ticketData.nombre_fiscalizador || 
    ticketData.nombre_inspector || 
    (ticketData.id_observacion ? `Observación de Terreno #${ticketData.id_observacion}` : 'Fiscalizador Municipal');

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
      <TicketHeader 
        idTicket={Number(ticketData.id_ticket)} 
        codConsultaExterna={String(ticketData.cod_consulta_externa || '')} 
      />

      <TicketInfoCard ticketData={ticketData} />

      {/* Información del Creador / Fiscalizador */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          Creado por / Fiscalizador
        </span>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
          {nombreCreador}
        </span>
      </div>

      {/* Fotografías de la Observación Inicial */}
      {ticketData.fotografias && ticketData.fotografias.length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginTop: 0, marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
            Fotografía Adjunta de la Observación Inicial
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {ticketData.fotografias.map((foto, index) => {
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

      {ticketData.evidencia && (
        <EvidenciaViewer evidencia={ticketData.evidencia} baseUrl={API_BASE_URL} />
      )}

      <AuditActionsForm 
        estado={String(ticketData.estado || '')} 
        onAuditar={handleAuditar} 
        submitting={submitting} 
      />
    </div>
  );
};

export default DetalleTicket;
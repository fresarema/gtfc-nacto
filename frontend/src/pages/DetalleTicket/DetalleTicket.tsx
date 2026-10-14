import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetalleTicket.module.css';

interface Fotografia {
  id_fotografia?: number;
  url_fotografia?: string;
  url?: string;
}

interface EvidenciaSupervisor {
  id_evidencia?: number;
  url_foto?: string;
  url?: string;
  descripcion_solucion?: string;
  fecha_carga?: string;
}

interface ItemDetalle {
  id?: number;
  id_ticket?: number;
  id_observacion?: number;
  titulo?: string;
  nombre?: string;
  descripcion: string;
  descripcion_ticket?: string;
  ubicacion?: string;
  direccion?: string;
  estado?: string;
  fecha?: string;
  fecha_registro?: string;
  hora_registro?: string;
  prioridad?: string;
  fotografias?: (Fotografia | string)[];
  evidencia?: EvidenciaSupervisor | null;
  ubicacion_observacion?: any;
  creado_por?: string | { nombre?: string; apellido?: string };
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const DetalleTicket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<ItemDetalle | null>(null);
  const [esObservacion, setEsObservacion] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isModalEvidenciaOpen, setIsModalEvidenciaOpen] = useState<boolean>(false);
  const [procesando, setProcesando] = useState<boolean>(false);

  // Formulario para CONVERTIR Observación a Ticket
  const [idEmpresa, setIdEmpresa] = useState<string>('1');
  const [idArea, setIdArea] = useState<string>('1');
  const [prioridad, setPrioridad] = useState<string>('Alta');
  const [diasPlazo, setDiasPlazo] = useState<number>(5);
  const [instruccionesTicket, setInstruccionesTicket] = useState<string>('');

  // Formulario para RECHAZAR Subsanación
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState<boolean>(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };

      // 1. Intentar consultar endpoint de tickets
      const resTicket = await fetch(`${API_BASE_URL}/api/tickets/${id}/`, { headers });
      
      if (resTicket.ok) {
        const ticketData = await resTicket.json();
        setItem(ticketData);
        setEsObservacion(false);
      } else {
        // 2. Fallback a lista de observaciones
        const resObs = await fetch(`${API_BASE_URL}/api/observaciones/`, { headers });
        if (!resObs.ok) throw new Error('No se pudo establecer conexión con el servidor backend.');
        
        const listObs: ItemDetalle[] = await resObs.json();
        const obsEncontrada = listObs.find((obs) => {
          const realId = obs.id_observacion ?? obs.id;
          return String(realId) === String(id);
        });

        if (!obsEncontrada) {
          throw new Error(`El registro #${id} no existe.`);
        }

        setItem(obsEncontrada);
        setEsObservacion(true);
        setInstruccionesTicket(obsEncontrada.descripcion || '');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const obtenerUrlImagen = (path?: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/${path}`;
  };

  // Convertir Observación a Ticket
  const handleCrearTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcesando(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const realIdObs = item?.id_observacion ?? item?.id ?? id;

      const res = await fetch(`${API_BASE_URL}/api/tickets/convertir/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id_observacion: Number(realIdObs),
          id_empresa: Number(idEmpresa),
          id_area: Number(idArea),
          prioridad,
          dias_plazo: Number(diasPlazo),
          descripcion_ticket: instruccionesTicket
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.mensaje || 'Error al generar el ticket.');
      }

      const resData = await res.json();
      alert(`¡Ticket generado exitosamente! Código: ${resData.cod_consulta_externa}`);
      navigate('/bandeja-municipal');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  // Aprobar subsanación
  const handleAprobar = async () => {
    if (!window.confirm('¿Confirmas que la evidencia presentada es satisfactoria y deseas cerrar este ticket?')) return;

    try {
      setProcesando(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/api/tickets/auditar/${id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          estado: 'Cerrado',
          comentario: 'Subsanación aprobada por el usuario municipal.' 
        }),
      });

      if (!res.ok) throw new Error('No se pudo aprobar la subsanación.');

      alert('¡Ticket APROBADO y CERRADO exitosamente!');
      navigate('/bandeja-municipal');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  // Rechazar subsanación
  const handleRechazar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoRechazo.trim()) {
      alert('Debes indicar el motivo del rechazo.');
      return;
    }

    try {
      setProcesando(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/api/tickets/auditar/${id}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          estado: 'Rechazado', 
          comentario: motivoRechazo 
        }),
      });

      if (!res.ok) throw new Error('No se pudo procesar el rechazo.');

      alert('La subsanación fue rechazada y devuelta al supervisor.');
      navigate('/bandeja-municipal');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return <div className={styles.container}>Cargando información...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!item) return null;

  const realIdDisplay = item.id_ticket ?? item.id_observacion ?? item.id ?? id;
  const estadoActual = item.estado || 'Pendiente';

  // Obtener fotografía original
  let fotoOriginalUrl = null;
  if (item.fotografias && Array.isArray(item.fotografias) && item.fotografias.length > 0) {
    const fotoItem = item.fotografias[0];
    const raw = typeof fotoItem === 'object' && fotoItem !== null ? (fotoItem.url_fotografia || fotoItem.url) : fotoItem;
    fotoOriginalUrl = obtenerUrlImagen(raw as string);
  }

  // Obtener evidencia enviada por supervisor
  const fotoEvidenciaSupervisorUrl = item.evidencia 
    ? obtenerUrlImagen(item.evidencia.url_foto || item.evidencia.url) 
    : null;

  // Lógica segura para formatear la Ubicación como String
  let ubicacionTexto = 'No especificada';
  let googleMapsUrl = null;

  const obsUbic = item.ubicacion_observacion;
  if (obsUbic && typeof obsUbic === 'object') {
    const lat = obsUbic.latitud;
    const lon = obsUbic.longitud;
    const dir = obsUbic.direccion;

    if (dir && typeof dir === 'string' && dir !== 'Terreno GPS') {
      ubicacionTexto = dir;
    } else if (lat && lon) {
      ubicacionTexto = `Lat: ${lat}, Lng: ${lon}`;
      googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    }
  } else if (typeof obsUbic === 'string') {
    ubicacionTexto = obsUbic;
  } else if (typeof item.direccion === 'string') {
    ubicacionTexto = item.direccion;
  } else if (typeof item.ubicacion === 'string') {
    ubicacionTexto = item.ubicacion;
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/bandeja-municipal')} className={styles.backButton}>
        ← Volver a Bandeja Municipal
      </button>

      <div className={styles.cardDetail}>
        <div className={styles.headerRow}>
          <h1>{esObservacion ? `Observación Terreno #${realIdDisplay}` : `Ticket Oficial #${realIdDisplay}`}</h1>
          <span className={styles.badge}>{estadoActual}</span>
        </div>

        {/* FOTO EVIDENCIA ORIGINAL */}
        <h3 style={{ marginTop: '1.5rem', color: '#1e293b' }}>Fotografía del Inspector (Terreno)</h3>
        {fotoOriginalUrl ? (
          <div className={styles.imageContainer} onClick={() => setIsModalOpen(true)}>
            <img src={fotoOriginalUrl} alt={`Original ${realIdDisplay}`} className={styles.image} />
          </div>
        ) : (
          <div className={styles.imagePlaceholder}>
            <p>Sin fotografía de evidencia adjunta</p>
          </div>
        )}

        {isModalOpen && fotoOriginalUrl && (
          <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>&times;</button>
              <img src={fotoOriginalUrl} alt="Ampliada" className={styles.modalImage} />
            </div>
          </div>
        )}

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>N° Registro</label>
            <p>#{realIdDisplay}</p>
          </div>
          <div className={styles.infoItem}>
            <label>Ubicación / Coordenadas GPS</label>
            <p>{ubicacionTexto}</p>
            {googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}>
                Ver en Google Maps ↗
              </a>
            )}
          </div>
          <div className={styles.infoItem}>
            <label>Fecha de Registro</label>
            <p>{item.fecha_registro || item.fecha || 'Sin fecha'}</p>
          </div>
        </div>

        <div className={styles.descriptionBox}>
          <label>Descripción del Inspector</label>
          <p>{item.descripcion || 'Sin descripción.'}</p>
        </div>

        {/* SI ES UNA OBSERVACIÓN PENDIENTE: FORMULARIO PARA CREAR TICKET */}
        {esObservacion ? (
          <form onSubmit={handleCrearTicket} style={{ marginTop: '2.5rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#0f172a', marginTop: 0, marginBottom: '1rem' }}>Generar Ticket Oficial de Subsanación</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Empresa Asignada</label>
                <select value={idEmpresa} onChange={(e) => setIdEmpresa(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="1">Empresa Contratista A</option>
                  <option value="2">Empresa Contratista B</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Área de Gestión</label>
                <select value={idArea} onChange={(e) => setIdArea(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="1">Obras Públicas / Vías</option>
                  <option value="2">Aseo y Ornato</option>
                  <option value="3">Alumbrado Público</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Prioridad</label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Días de Plazo</label>
                <input 
                  type="number" 
                  min="1" 
                  max="30" 
                  value={diasPlazo} 
                  onChange={(e) => setDiasPlazo(Number(e.target.value))} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Instrucciones para el Supervisor</label>
              <textarea 
                rows={3} 
                value={instruccionesTicket} 
                onChange={(e) => setInstruccionesTicket(e.target.value)} 
                required 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={procesando} 
              style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {procesando ? 'Generando Ticket...' : '✓ Aprobar y Convertir a Ticket Oficial'}
            </button>
          </form>
        ) : (
          /* SI YA ES UN TICKET OFICIAL: MOSTRAR EVIDENCIA Y ACCIONES MUNICIPALES */
          <div style={{ marginTop: '2.5rem', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Evidencia de Subsanación (Supervisor / Empresa)</h3>

            {item.evidencia ? (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                {fotoEvidenciaSupervisorUrl && (
                  <div className={styles.imageContainer} onClick={() => setIsModalEvidenciaOpen(true)} style={{ maxWidth: '400px', marginBottom: '1rem' }}>
                    <img src={fotoEvidenciaSupervisorUrl} alt="Evidencia Subsanación" className={styles.image} />
                  </div>
                )}

                {isModalEvidenciaOpen && fotoEvidenciaSupervisorUrl && (
                  <div className={styles.modalOverlay} onClick={() => setIsModalEvidenciaOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                      <button className={styles.closeButton} onClick={() => setIsModalEvidenciaOpen(false)}>&times;</button>
                      <img src={fotoEvidenciaSupervisorUrl} alt="Evidencia Subsanación Ampliada" className={styles.modalImage} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontWeight: 600, display: 'block', fontSize: '0.85rem', color: '#475569' }}>Descripción de los Trabajos Realizados:</label>
                  <p style={{ marginTop: '4px', color: '#1e293b' }}>{item.evidencia.descripcion_solucion || 'Sin detalle'}</p>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={handleAprobar} disabled={procesando} style={{ background: '#16a34a', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    {procesando ? 'Procesando...' : '✓ Aprobar y Cerrar Ticket'}
                  </button>

                  <button onClick={() => setMostrarModalRechazo(true)} disabled={procesando} style={{ background: '#dc2626', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    ✕ Rechazar y Devolver
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '6px', color: '#92400e' }}>
                <p>El supervisor aún no ha enviado evidencia de subsanación para este ticket.</p>
              </div>
            )}

            {mostrarModalRechazo && (
              <form onSubmit={handleRechazar} style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                <h4 style={{ color: '#991b1b', marginTop: 0 }}>Motivo del Rechazo / Devolución</h4>
                <textarea
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Detalla qué correcciones debe realizar el supervisor..."
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" disabled={procesando} style={{ background: '#dc2626', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    Confirmar Devolución
                  </button>
                  <button type="button" onClick={() => setMostrarModalRechazo(false)} style={{ background: '#64748b', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleTicket;
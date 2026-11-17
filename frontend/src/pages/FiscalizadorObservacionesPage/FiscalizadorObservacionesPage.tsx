import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './FiscalizadorObservacionesPage.css';

interface Observacion {
  id: number;
  id_observacion: number;
  descripcion: string;
  fecha_registro: string;
  hora_registro: string;
  estado: string;
  ubicacion_observacion: any;
  fotografias: string[];
}

export default function FiscalizadorObservacionesPage() {
  const navigate = useNavigate();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const [observacionSeleccionada, setObservacionSeleccionada] = useState<Observacion | null>(null);

  useEffect(() => {
    fetchMisObservaciones();
  }, []);

  const fetchMisObservaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.get('/fiscalizador/observaciones/', { headers });
      setObservaciones(response.data || []);
    } catch (err: any) {
      console.error('Error detallado al cargar observaciones:', err.response || err);
      setError('No se pudieron cargar tus observaciones.');
    } finally {
      setLoading(false);
    }
  };

  const formatearUbicacion = (ubicacion: any) => {
    if (!ubicacion) return 'Sin ubicación registrada';
    if (typeof ubicacion === 'object') {
      return `Lat: ${ubicacion.latitud || 'N/A'}, Lng: ${ubicacion.longitud || 'N/A'}`;
    }
    return String(ubicacion);
  };

  return (
    <div className="fiscalizador-obs-layout">
      <div className="fiscalizador-obs-container">
        
        <header className="fiscalizador-obs-header">
          <div>
            <h1 className="fiscalizador-obs-title">Mis Observaciones</h1>
            <p className="fiscalizador-obs-subtitle">Historial de registros realizados en terreno</p>
          </div>
        </header>

        {error && <div className="fiscalizador-error-banner">{error}</div>}

        {loading ? (
          <div className="fiscalizador-loading-state">Cargando registros...</div>
        ) : (
          <div className="fiscalizador-obs-content">
            {observaciones.length > 0 ? (
              <div className="fiscalizador-grid-cards">
                {observaciones.map((obs) => (
                  <div 
                    key={obs.id_observacion || obs.id} 
                    className="obs-card-item"
                    onClick={() => setObservacionSeleccionada(obs)}
                    style={{ cursor: 'pointer' }}
                    title="Haz clic para ver el detalle"
                  >
                    <div className="obs-card-top">
                      <span className="obs-id">#{obs.id_observacion || obs.id}</span>
                      <span className="obs-fecha">
                        {obs.fecha_registro} {obs.hora_registro ? `- ${obs.hora_registro}` : ''}
                      </span>
                    </div>
                    
                    <p className="obs-descripcion">
                      <strong>Descripción:</strong> {obs.descripcion.length > 90 ? obs.descripcion.substring(0, 90) + '...' : obs.descripcion}
                    </p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <p className="obs-ubicacion" style={{ fontSize: '0.825rem', color: '#64748b', margin: '0' }}>
                        <em>{formatearUbicacion(obs.ubicacion_observacion)}</em>
                      </p>
                      <span style={{ fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 600 }}>
                        Ver detalle →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-empty-obs">
                No tienes observaciones registradas en este momento.
              </div>
            )}
          </div>
        )}

        {/* BOTÓN DE RETORNO ACCESIBLE EN LA PARTE INFERIOR */}
        <div style={{ marginTop: '2rem', textAlign: 'center', paddingBottom: '1rem' }}>
          <button 
            onClick={() => navigate('/fiscalizador')} 
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '0.75rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'background-color 0.2s'
            }}
          >
            ← Volver al Menú Principal
          </button>
        </div>
      </div>

      {/* MODAL DE DETALLE DE LA OBSERVACIÓN */}
      {observacionSeleccionada && (
        <div className="obs-modal-backdrop" onClick={() => setObservacionSeleccionada(null)}>
          <div className="obs-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Detalle de Observación #{observacionSeleccionada.id_observacion}</h3>
              <button 
                onClick={() => setObservacionSeleccionada(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div className="obs-preview-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
              <div className="obs-preview-item">
                <strong>Estado Actual:</strong>{' '}
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '0.85rem' }}>
                  {observacionSeleccionada.estado || 'Pendiente'}
                </span>
              </div>

              <div className="obs-preview-item">
                <strong>Fecha y Hora de Registro:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#334155' }}>
                  {observacionSeleccionada.fecha_registro} {observacionSeleccionada.hora_registro ? `a las ${observacionSeleccionada.hora_registro}` : ''}
                </p>
              </div>

              <div className="obs-preview-item">
                <strong>Ubicación GPS:</strong>
                <p style={{ margin: '0.2rem 0 0 0', color: '#334155' }}>
                  {formatearUbicacion(observacionSeleccionada.ubicacion_observacion)}
                </p>
              </div>

              <div className="obs-preview-item">
                <strong>Descripción Completa:</strong>
                <p className="obs-preview-desc" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', margin: '0.2rem 0 0 0', color: '#1e293b' }}>
                  {observacionSeleccionada.descripcion}
                </p>
              </div>

              {observacionSeleccionada.fotografias && observacionSeleccionada.fotografias.length > 0 && (
                <div className="obs-preview-item">
                  <strong>Evidencia Fotográfica:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {observacionSeleccionada.fotografias.map((fotoUrl, idx) => (
                      <div key={idx} style={{ border: '1px solid #cbd5e1', borderRadius: '0.5rem', padding: '0.5rem', background: '#f8fafc' }}>
                        <a href={`http://localhost:8000${fotoUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>
                          Ver imagen en tamaño completo ↗
                        </a>
                        <img 
                          src={`http://localhost:8000${fotoUrl}`} 
                          alt={`Evidencia ${idx + 1}`} 
                          style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '0.375rem' }} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button 
                type="button" 
                onClick={() => setObservacionSeleccionada(null)}
                className="btn-modal-back"
                style={{ width: '100%', padding: '0.75rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
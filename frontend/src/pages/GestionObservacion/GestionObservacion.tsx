import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GestionObservacion.module.css';

interface UserInfo {
  username?: string;
  nombre?: string;
  email?: string;
  avatar?: string;
  foto_perfil?: string;
}

interface ObservacionDetalle {
  id: number;
  id_observacion: number;
  descripcion: string;
  ubicacion_observacion?: unknown;
  fecha_registro?: string;
  hora_registro?: string;
  estado?: string;
  fotografias?: string[];
  usuario?: string | UserInfo;
  creado_por?: string | UserInfo;
  inspector?: string | UserInfo;
  autor?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const GestionObservacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [observacion, setObservacion] = useState<ObservacionDetalle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [empresa, setEmpresa] = useState<string>('');
  const [diasPlazo, setDiasPlazo] = useState<number>(3);
  const [indicaciones, setIndicaciones] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchObservacion = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(`${API_BASE_URL}/api/observaciones/`, { headers });
        if (!response.ok) throw new Error('Error al cargar detalle de la observación.');

        const data = await response.json();
        const lista = Array.isArray(data) ? data : (data.results || []);
        const encontrada = lista.find((item: Record<string, unknown>) => String(item.id_observacion || item.id) === String(id));

        if (encontrada) {
          setObservacion(encontrada as ObservacionDetalle);
        } else {
          setError('No se encontró la observación especificada.');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error de conexión con el servidor');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchObservacion();
  }, [id]);

  const buildImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const renderUbicacion = (ubicacion: unknown) => {
    if (!ubicacion) return 'Sin ubicación registrada';
    
    let textoStr: string;
    if (typeof ubicacion === 'string') {
      textoStr = ubicacion;
    } else if (typeof ubicacion === 'object' && ubicacion !== null) {
      const ubiObj = ubicacion as Record<string, unknown>;
      const direccion = typeof ubiObj.direccion === 'string' ? ubiObj.direccion : undefined;
      const nombre = typeof ubiObj.nombre === 'string' ? ubiObj.nombre : undefined;
      const lat = typeof ubiObj.latitud === 'number' || typeof ubiObj.latitud === 'string' ? ubiObj.latitud : undefined;
      const lng = typeof ubiObj.longitud === 'number' || typeof ubiObj.longitud === 'string' ? ubiObj.longitud : undefined;

      if (direccion) {
        textoStr = direccion;
      } else if (nombre) {
        textoStr = nombre;
      } else if (lat !== undefined && lng !== undefined) {
        textoStr = `Lat: ${lat}, Lng: ${lng}`;
      } else {
        textoStr = JSON.stringify(ubicacion);
      }
    } else {
      textoStr = String(ubicacion);
    }

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoStr)}`;

    return (
      <a 
        href={googleMapsUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.mapsLink}
        title="Ver ubicación en Google Maps"
      >
        <span>📍 {textoStr}</span>
        <span className={styles.mapsLinkSpan}>(Ver en Maps ↗)</span>
      </a>
    );
  };

  const getuserInfo = (obs: ObservacionDetalle) => {
    const rawUser = obs.usuario || obs.creado_por || obs.inspector || obs.autor;
    if (!rawUser) return { nombre: 'Fiscalizador de Terreno', avatar: '' };

    if (typeof rawUser === 'string') {
      return { nombre: rawUser, avatar: '' };
    }

    if (typeof rawUser === 'object') {
      const nombre = rawUser.nombre || rawUser.username || rawUser.email || 'Fiscalizador de Terreno';
      const avatarRaw = rawUser.avatar || rawUser.foto_perfil || '';
      const avatar = avatarRaw ? buildImageUrl(avatarRaw) : '';
      return { nombre, avatar };
    }

    return { nombre: 'Fiscalizador de Terreno', avatar: '' };
  };

  const handleGenerarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa.trim()) {
      alert('Por favor ingrese la empresa responsable.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const payload = {
        id_observacion: observacion?.id_observacion || observacion?.id,
        empresa_responsable: empresa,
        dias_plazo: diasPlazo,
        indicaciones: indicaciones,
      };

      const response = await fetch(`${API_BASE_URL}/api/tickets/convertir/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Error al generar el ticket oficial.');
      }

      alert('¡Ticket Oficial generado exitosamente!');
      navigate('/observaciones-pendientes');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Error al procesar la solicitud.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '30px', marginLeft: '260px' }}>Cargando observación...</div>;
  if (error || !observacion) return <div style={{ padding: '30px', marginLeft: '260px', color: 'red' }}>Error: {error || 'Registro no encontrado'}</div>;

  const fotos = observacion.fotografias || [];
  const userInfo = getuserInfo(observacion);

  return (
    <div className={styles.container}>
      <button 
        onClick={() => navigate('/observaciones-pendientes')}
        className={styles.backButton}
      >
        ← Volver a Observaciones
      </button>

      <h2 className={styles.title}>Gestionar Observación #{observacion.id_observacion || observacion.id}</h2>
      <span className={styles.badge}>
        {observacion.estado || 'Pendiente de Conversión'}
      </span>

      {/* TARJETA DETALLES DEL TERRENO */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Detalles del Terreno</h3>
        
        {/* SECCIÓN INFORMACIÓN DE QUIEN LA SUBIÓ */}
        <div className={styles.userBox}>
          <div className={styles.avatar}>
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt={userInfo.nombre} className={styles.avatarImage} />
            ) : (
              userInfo.nombre.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <span className={styles.userInfoLabel}>Registrado por:</span>
            <strong className={styles.userInfoName}>{userInfo.nombre}</strong>
          </div>
        </div>

        <p className={styles.fieldParagraph}><strong>Descripción / Hallazgo:</strong> {observacion.descripcion}</p>
        <p className={styles.fieldParagraph}><strong>Ubicación:</strong> {renderUbicacion(observacion.ubicacion_observacion)}</p>
        <p className={styles.fieldParagraph}><strong>Fecha de Registro:</strong> {observacion.fecha_registro || 'Sin fecha'} {observacion.hora_registro ? `- ${observacion.hora_registro}` : ''}</p>

        {/* GALERÍA DE FOTOGRAFÍAS SUBIDAS POR EL FISCALIZADOR */}
        <div className={styles.photosSection}>
          <strong className={styles.photosLabel}>
            Evidencia Fotográfica de Terreno ({fotos.length}):
          </strong>
          
          {fotos.length === 0 ? (
            <p className={styles.noPhotos}>No se adjuntaron fotografías en este registro.</p>
          ) : (
            <div className={styles.photosContainer}>
              {fotos.map((fotoUrl, idx) => {
                const fullUrl = buildImageUrl(fotoUrl);
                return (
                  <div key={idx} className={styles.photoWrapper}>
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" title="Ver imagen en tamaño completo">
                      <img 
                        src={fullUrl} 
                        alt={`Evidencia ${idx + 1}`} 
                        className={styles.photoImage}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO GENERAR TICKET */}
      <div className={styles.card}>
        <h3 className={styles.formTitle}>Generar Ticket Oficial</h3>
        <p className={styles.formSubtitle}>
          Asigne la empresa responsable y los días de plazo para notificar al supervisor.
        </p>

        <form onSubmit={handleGenerarTicket}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Empresa Responsable / Supervisor:
            </label>
            <input 
              type="text"
              placeholder="Ej: Contratista Obras Civiles SpA"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Días de Plazo para Subsanar:
            </label>
            <input 
              type="number"
              min={1}
              value={diasPlazo}
              onChange={(e) => setDiasPlazo(Number(e.target.value))}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Indicaciones Adicionales:
            </label>
            <textarea 
              rows={3}
              placeholder="Instrucciones para la empresa contratista..."
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              className={styles.formTextarea}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? 'Procesando...' : 'Aprobar y Generar Ticket Oficial'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GestionObservacion;
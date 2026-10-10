import React, { useEffect, useState } from 'react';
import styles from './BandejaMunicipal.module.css';

interface Ubicacion {
  latitud?: number;
  longitud?: number;
  direccion?: string;
}

interface Observacion {
  id_observacion: number;
  fecha_registro: string;
  hora_registro: string;
  descripcion: string;
  ubicacion_observacion: string | Ubicacion;
  estado: string;
  fotografias: string[];
}

const BandejaMunicipal: React.FC = () => {
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObservaciones = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/observaciones/');
        if (!response.ok) {
          throw new Error('Error al cargar las observaciones pendientes');
        }
        const data = await response.json();
        setObservaciones(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error desconocido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchObservaciones();
  }, []);

  // Función auxiliar para formatear la ubicación independientemente de si llega como string u objeto
  const formatUbicacion = (ubicacion: string | Ubicacion) => {
    if (typeof ubicacion === 'string') {
      return ubicacion;
    }
    if (ubicacion && typeof ubicacion === 'object') {
      if (ubicacion.direccion) {
        return ubicacion.direccion;
      }
      if (ubicacion.latitud !== undefined && ubicacion.longitud !== undefined) {
        return `${ubicacion.latitud}, ${ubicacion.longitud}`;
      }
    }
    return 'Ubicación no especificada';
  };

  if (loading) {
    return <div className={styles.loading}>Cargando bandeja municipal...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Bandeja Municipal - Observaciones Pendientes</h1>
        <span className={styles.badge}>
          {observaciones.length} Pendientes
        </span>
      </div>

      {observaciones.length === 0 ? (
        <div className={styles.empty}>
          No hay observaciones pendientes en este momento.
        </div>
      ) : (
        <div className={styles.grid}>
          {observaciones.map((obs) => (
            <div key={obs.id_observacion} className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>ID: #{obs.id_observacion}</span>
                  <span className={styles.cardDate}>
                    {obs.fecha_registro} {obs.hora_registro}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.description}>{obs.descripcion}</p>
                  
                  <div className={styles.location}>
                    <span className={styles.locationLabel}>Ubicación:</span> {formatUbicacion(obs.ubicacion_observacion)}
                  </div>

                  {obs.fotografias && obs.fotografias.length > 0 && (
                    <div className={styles.photosSection}>
                      <p className={styles.photosTitle}>Evidencia Fotográfica:</p>
                      <div className={styles.photosContainer}>
                        {obs.fotografias.map((fotoUrl, index) => (
                          <a key={index} href={`http://localhost:8000${fotoUrl}`} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={`http://localhost:8000${fotoUrl}`} 
                              alt={`Evidencia ${index}`} 
                              className={styles.photoThumbnail}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button className={styles.btnSecondary}>
                  Ver detalle
                </button>
                <button className={styles.btnPrimary}>
                  Gestionar / Atender
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BandejaMunicipal;
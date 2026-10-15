import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ObservacionesATickets.module.css';

interface UbicacionObjeto {
  direccion?: string;
  nombre?: string;
  [key: string]: unknown;
}

interface Observacion {
  id: number;
  id_observacion: number;
  descripcion: string;
  ubicacion_observacion?: string | UbicacionObjeto;
  fecha_registro?: string;
  estado?: string;
  fotografias?: string[];
  [key: string]: unknown;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const ObservacionesATickets: React.FC = () => {
  const navigate = useNavigate();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObservaciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(`${API_BASE_URL}/api/observaciones/`, { headers });
        if (!response.ok) {
          throw new Error('Error al obtener las observaciones de terreno.');
        }

        const data = await response.json();
        setObservaciones(Array.isArray(data) ? data : (data.results || []));
        setError(null);
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

    fetchObservaciones();
  }, []);

  // Función auxiliar para extraer el texto de la ubicación de forma segura sin importar si es string u objeto
  const renderUbicacion = (ubicacion: string | UbicacionObjeto | undefined): string => {
    if (!ubicacion) return 'Sin ubicación';
    if (typeof ubicacion === 'string') return ubicacion;
    if (typeof ubicacion === 'object' && ubicacion !== null) {
      const ubiObj = ubicacion as UbicacionObjeto;
      return String(ubiObj.direccion || ubiObj.nombre || JSON.stringify(ubiObj));
    }
    return String(ubicacion);
  };

  if (loading) return <div className={styles.container}>Cargando observaciones pendientes...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestión de Observaciones a Tickets</h2>
      <p className={styles.subtitle}>
        Transforma las observaciones de terreno en tickets oficiales para su seguimiento.
      </p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Ubicación</th>
              <th>Fecha</th>
              <th className={styles.thActions}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {observaciones.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No hay observaciones pendientes de transformar.
                </td>
              </tr>
            ) : (
              observaciones.map((obs) => (
                <tr key={obs.id_observacion || obs.id}>
                  <td className={styles.tdId}>#{obs.id_observacion || obs.id}</td>
                  <td>{obs.descripcion}</td>
                  <td>{renderUbicacion(obs.ubicacion_observacion)}</td>
                  <td className={styles.tdDate}>{obs.fecha_registro || 'Sin fecha'}</td>
                  <td className={styles.tdActions}>
                    <button 
                      className={styles.detailButton}
                      onClick={() => navigate(`/observacion/${obs.id_observacion || obs.id}`)}
                    >
                      Ver Detalle / Gestionar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ObservacionesATickets;
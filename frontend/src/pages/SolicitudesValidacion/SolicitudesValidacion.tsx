import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SolicitudesValidacion.module.css';

interface Observacion {
  id: number;
  titulo?: string;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
  foto?: string;
}

export const SolicitudesValidacion: React.FC = () => {
  const navigate = useNavigate();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/observaciones/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al conectar con el servidor');
        }
        return response.json();
      })
      .then((data) => {
        setObservaciones(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filtrar exclusivamente los tickets pendientes de validación
  const pendientes = observaciones.filter(
    (obs) => !obs.estado || obs.estado.toLowerCase() === 'pendiente'
  );

  if (loading) return <div className={styles.container}>Cargando solicitudes de validación...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Solicitudes de Validación</h1>
        <p>Revisión y aprobación de incidencias pendientes de los inspectores</p>
      </header>

      {pendientes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay solicitudes pendientes de validación en este momento.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pendientes.map((obs, index) => {
            const itemKey = obs.id ? `obs-${obs.id}-${index}` : `obs-idx-${index}`;
            const ticketId = obs.id ?? (index + 1); // Respaldo seguro para evitar "undefined"

            return (
              <div key={itemKey} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.ticketId}>Ticket #{ticketId}</span>
                  <span className={styles.badgePending}>Pendiente</span>
                </div>

                {obs.foto && (
                  <div className={styles.imageContainer}>
                    <img src={obs.foto} alt={`Evidencia ${ticketId}`} className={styles.image} />
                  </div>
                )}

                <div className={styles.cardBody}>
                  <p><strong>Ubicación:</strong> {obs.ubicacion || 'No especificada'}</p>
                  <p><strong>Descripción:</strong> {obs.descripcion}</p>
                  {obs.fecha && <p className={styles.date}><strong>Fecha:</strong> {obs.fecha}</p>}
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    onClick={() => navigate(`/solicitudes-validacion/${ticketId}`)} 
                    className={styles.validateButton}
                  >
                    Ver Detalle / Validar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolicitudesValidacion;
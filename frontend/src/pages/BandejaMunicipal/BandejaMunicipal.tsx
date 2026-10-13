import React, { useEffect, useState } from 'react';
import styles from './BandejaMunicipal.module.css';

interface Observacion {
  id: number;
  titulo?: string;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
  foto?: string;
}

export const BandejaMunicipal: React.FC = () => {
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

  // Cálculo de KPIs basados en los datos
  const totalObservaciones = observaciones.length;
  const pendientesCount = observaciones.filter(
    (obs) => !obs.estado || obs.estado.toLowerCase() === 'pendiente'
  ).length;
  const atendidasCount = totalObservaciones - pendientesCount;

  if (loading) return <div className={styles.container}>Cargando indicadores...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Bandeja Municipal - Panel de Control</h1>
        <p>Resumen general de estado e indicadores de fiscalización</p>
      </header>

      {/* Sección de Tarjetas KPI */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiTotal}`}>
          <h3>Total de Registros</h3>
          <p className={styles.kpiNumber}>{totalObservaciones}</p>
          <span className={styles.kpiSubtitle}>Observaciones ingresadas</span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiPending}`}>
          <h3>Pendientes</h3>
          <p className={styles.kpiNumber}>{pendientesCount}</p>
          <span className={styles.kpiSubtitle}>Requieren atención</span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCompleted}`}>
          <h3>Atendidas / Resueltas</h3>
          <p className={styles.kpiNumber}>{atendidasCount}</p>
          <span className={styles.kpiSubtitle}>Procesadas con éxito</span>
        </div>
      </div>

      {/* Sección de actividad reciente */}
      <div className={styles.recentSection}>
        <h2>Actividad Reciente</h2>
        {observaciones.length === 0 ? (
          <p>No hay observaciones registradas.</p>
        ) : (
          <ul className={styles.recentList}>
            {observaciones.slice(0, 5).map((obs, index) => {
              const itemKey = obs.id ? `recent-${obs.id}-${index}` : `recent-idx-${index}`;
              const ticketId = obs.id ?? (index + 1);

              return (
                <li key={itemKey} className={styles.recentItem}>
                  <span><strong># {ticketId}</strong> - {obs.ubicacion || 'Sin ubicación'}</span>
                  <span className={styles.badge}>{obs.estado || 'Pendiente'}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BandejaMunicipal;
import React, { useEffect, useState } from 'react';
import styles from './HistorialTickets.module.css';

interface TicketHistorial {
  id: number;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
}

export const HistorialTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/observaciones/')
      .then((response) => {
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        return response.json();
      })
      .then((data) => {
        setTickets(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getBadgeClass = (estado?: string) => {
    const est = (estado || 'pendiente').toLowerCase();
    if (est === 'validado') return styles.badgeValidated;
    if (est === 'subsanado') return styles.badgeSubsanated;
    return styles.badgePending;
  };

  if (loading) return <div className={styles.container}>Cargando historial de tickets...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Historial General de Tickets</h1>
        <p>Registro y trazabilidad completa de todas las incidencias del sistema</p>
      </header>

      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay registros en el historial de tickets.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ubicación</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Estado Actual</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, index) => {
                const itemKey = ticket.id ? `hist-${ticket.id}-${index}` : `hist-idx-${index}`;
                const ticketId = ticket.id ?? (index + 1);
                const estadoTexto = ticket.estado || 'Pendiente';

                return (
                  <tr key={itemKey}>
                    <td><strong>#{ticketId}</strong></td>
                    <td>{ticket.ubicacion || 'No especificada'}</td>
                    <td>{ticket.descripcion}</td>
                    <td>{ticket.fecha || 'Sin fecha'}</td>
                    <td>
                      <span className={getBadgeClass(estadoTexto)}>
                        {estadoTexto.charAt(0).toUpperCase() + estadoTexto.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistorialTickets;
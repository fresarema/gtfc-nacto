import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SubsanacionTickets.module.css';

interface Ticket {
  id: number;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
  foto?: string;
}

export const SubsanacionTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
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

  // Filtrar exclusivamente los tickets validados (listos para que la empresa los subsane)
  const ticketsValidados = tickets.filter(
    (t) => t.estado && t.estado.toLowerCase() === 'validado'
  );

  if (loading) return <div className={styles.container}>Cargando tickets asignados...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Bandeja de Subsanación (Empresas)</h1>
        <p>Tickets oficiales aprobados pendientes de resolución y carga de evidencia</p>
      </header>

      {ticketsValidados.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay tickets validados pendientes de subsanación en este momento.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {ticketsValidados.map((ticket, index) => {
            const itemKey = ticket.id ? `ticket-${ticket.id}-${index}` : `ticket-idx-${index}`;
            const ticketId = ticket.id ?? (index + 1);

            return (
              <div key={itemKey} className={styles.card}>
                <div>
                  <div className={styles.cardHeader}>
                    <span className={styles.ticketId}>Ticket Oficial #{ticketId}</span>
                    <span className={styles.badgeValidated}>Validado</span>
                  </div>

                  <div className={styles.cardBody}>
                    <p><strong>Ubicación:</strong> {ticket.ubicacion || 'No especificada'}</p>
                    <p><strong>Descripción:</strong> {ticket.descripcion}</p>
                    {ticket.fecha && <p><strong>Fecha:</strong> {ticket.fecha}</p>}
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/subsanacion/${ticketId}`)} 
                  className={styles.actionButton}
                >
                  Subir Evidencia de Subsanación
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubsanacionTickets;
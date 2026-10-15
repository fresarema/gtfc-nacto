import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SubsanacionTickets.module.css';

interface Ticket {
  id: number;
  id_ticket: number;
  cod_consulta_externa: string;
  prioridad: string;
  descripcion: string;
  fecha_vencimiento: string;
  estado: string;
  area_asignada: string;
  [key: string]: unknown;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const SubsanacionTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketsSubsanacion = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
        if (!response.ok) {
          throw new Error('Error al obtener el listado de tickets.');
        }

        const data = await response.json();
        const listaTickets: Ticket[] = Array.isArray(data) ? data : (data.results || []);

        // 🛑 FILTRAR: Excluir tickets cerrados o resueltos para que solo queden pendientes de auditoría
        const ticketsActivos = listaTickets.filter((tk: Ticket) => {
          const estadoLower = String(tk.estado || '').toLowerCase().trim();
          return estadoLower !== 'cerrado' && estadoLower !== 'resuelto';
        });

        setTickets(ticketsActivos);
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

    fetchTicketsSubsanacion();
  }, []);

  if (loading) return <div className={styles.container}>Cargando tickets pendientes de auditoría...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Bandeja de Subsanación y Auditoría de Tickets</h2>
      <p className={styles.subtitle}>
        Revisa el estado, las evidencias y gestiona la auditoría de los tickets oficiales pendientes.
      </p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Área / Prioridad</th>
              <th>Estado</th>
              <th className={styles.thActions}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No hay tickets pendientes de subsanación o auditoría.
                </td>
              </tr>
            ) : (
              tickets.map((tk) => (
                <tr key={tk.id_ticket || tk.id}>
                  <td className={styles.tdId}>#{tk.cod_consulta_externa || tk.id_ticket}</td>
                  <td>{tk.descripcion}</td>
                  <td>
                    <span style={{ display: 'block', fontWeight: 600 }}>{tk.area_asignada}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Prioridad: {tk.prioridad}</span>
                  </td>
                  <td>
                    <span className={styles.badge}>
                      {tk.estado}
                    </span>
                  </td>
                  <td className={styles.tdActions}>
                    <button 
                      className={styles.detailButton}
                      onClick={() => navigate(`/subsanacion/${tk.id_ticket || tk.id}`)}
                    >
                      Auditar / Ver Detalle
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

export default SubsanacionTickets;
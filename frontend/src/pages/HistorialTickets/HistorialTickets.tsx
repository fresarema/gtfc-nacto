import React, { useEffect, useState } from 'react';
import styles from './HistorialTickets.module.css';

interface TicketHistorial {
  id: number;
  id_ticket?: number;
  descripcion?: string;
  estado?: string;
  fecha_vencimiento?: string;
  cod_consulta_externa?: string;
  area_asignada?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const HistorialTickets: React.FC = () => {
  const [ticketsCerrados, setTicketsCerrados] = useState<TicketHistorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Consumimos el endpoint general de supervisión/tickets que lista todos los registros
        const res = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
        if (!res.ok) throw new Error('No se pudo cargar el historial de tickets.');

        const data = await res.json();
        const lista: TicketHistorial[] = Array.isArray(data) ? data : (data.results || []);

        // Filtramos únicamente los tickets que estén cerrados o resueltos
        const cerrados = lista.filter(t => {
          const estado = (t.estado || '').toLowerCase();
          return ['cerrado', 'resuelto'].includes(estado);
        });

        setTicketsCerrados(cerrados);
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  if (loading) return <div className={styles.container}>Cargando historial de tickets...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Historial de Tickets Cerrados</h2>
      <p className={styles.subtitle}>Registro oficial de todas las observaciones y tickets que han sido subsanados y aprobados.</p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Registro</th>
              <th>Código / Asunto</th>
              <th>Área</th>
              <th>Estado</th>
              <th>Fecha Límite / Cierre</th>
            </tr>
          </thead>
          <tbody>
            {ticketsCerrados.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>No hay tickets cerrados en el historial.</td>
              </tr>
            ) : (
              ticketsCerrados.map((item) => {
                const realId = item.id_ticket || item.id;
                return (
                  <tr key={realId}>
                    <td>#{realId}</td>
                    <td>
                      <strong>{item.cod_consulta_externa || `Ticket #${realId}`}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.descripcion}</div>
                    </td>
                    <td>{item.area_asignada || 'General'}</td>
                    <td>
                      <span className={styles.badgeCerrado}>{item.estado}</span>
                    </td>
                    <td>{item.fecha_vencimiento || 'N/A'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialTickets;
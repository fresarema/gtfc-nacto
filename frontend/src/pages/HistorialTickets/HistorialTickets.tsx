import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HistorialTickets.module.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

interface Ticket {
  id: number | string;
  id_ticket?: number | string;
  cod_consulta_externa?: string;
  titulo?: string;
  descripcion?: string;
  estado: string;
  fecha_vencimiento?: string;
  [key: string]: unknown;
}

export const HistorialTickets: React.FC = () => {
  const [ticketsCerrados, setTicketsCerrados] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
        
        if (!res.ok) {
          throw new Error('No se pudo cargar el listado de tickets.');
        }

        const data = await res.json();
        const listado: Ticket[] = Array.isArray(data) ? data : (data.results || []);

        const cerrados = listado.filter((ticket: Ticket) => {
          const estado = (ticket.estado || '').toLowerCase();
          return estado === 'cerrado' || estado === 'resuelto' || estado === 'finalizado';
        });

        setTicketsCerrados(cerrados);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar el historial.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  return (
    <div className={styles.container} style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className={styles.headerRow}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Historial de Tickets</h1>
      </div>
      <p className={styles.subtitle} style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Registro de auditoría y visualización de tickets cerrados o resueltos.
      </p>

      {error && <div className={styles.errorAlert} style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p>Cargando historial...</p>
      ) : ticketsCerrados.length === 0 ? (
        <p>No se encontraron tickets cerrados en el historial.</p>
      ) : (
        <>
          {/* Estilos responsivos inyectados para convertir la tabla en tarjetas en móvil */}
          <style>{`
            .historial-table-wrapper {
              width: 100%;
              overflow-x: auto;
            }
            .desktop-table {
              width: 100%;
              border-collapse: collapse;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .desktop-table th, .desktop-table td {
              padding: 0.75rem 1rem;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
              font-size: 0.9rem;
            }
            .desktop-table th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: 600;
            }
            .mobile-cards-container {
              display: none;
            }

            @media (max-width: 768px) {
              .desktop-table-wrapper {
                display: none;
              }
              .mobile-cards-container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
              }
              .ticket-card-mobile {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 1px 2px rgba(0,0,0,0.04);
              }
            }
          `}</style>

          {/* Vista Escritorio (Tabla tradicional) */}
          <div className="desktop-table-wrapper">
            <table className="desktop-table">
              <thead>
                <tr>
                  <th>N° Ticket / Código</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ticketsCerrados.map((ticket) => {
                  const realId = ticket.id_ticket ?? ticket.id;
                  return (
                    <tr key={realId}>
                      <td><strong>#{realId}</strong><br/><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ticket.cod_consulta_externa}</span></td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ticket.descripcion || 'Sin descripción'}
                        </div>
                      </td>
                      <td>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td>{ticket.fecha_vencimiento || 'Sin fecha'}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/detalle-ticket/${realId}`)}
                          style={{
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          }}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Móvil (Tarjetas apiladas adaptables) */}
          <div className="mobile-cards-container">
            {ticketsCerrados.map((ticket) => {
              const realId = ticket.id_ticket ?? ticket.id;
              return (
                <div key={realId} className="ticket-card-mobile">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>#{realId}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>({ticket.cod_consulta_externa})</span>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {ticket.estado}
                    </span>
                  </div>

                  <p style={{ color: '#334155', fontSize: '0.9rem', margin: '0.5rem 0', lineHeight: 1.4 }}>
                    {ticket.descripcion || 'Sin descripción'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Vence: {ticket.fecha_vencimiento || 'N/A'}
                    </span>
                    <button
                      onClick={() => navigate(`/detalle-ticket/${realId}`)}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      Ver Detalle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default HistorialTickets;
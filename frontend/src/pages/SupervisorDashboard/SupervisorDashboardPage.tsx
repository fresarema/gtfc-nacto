import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './SupervisorDashboardPage.css';
import fondo from '../../assets/whiteBG.png';

export default function SupervisorDashboardPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Obtener datos del usuario logueado
  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;

  useEffect(() => {
    fetchTicketsSupervisor();
  }, []);

  const fetchTicketsSupervisor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Petición al endpoint del backend para la bandeja del supervisor
      const response = await api.get('/tickets/supervisor/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTickets(response.data);
    } catch (err: any) {
      console.error('Error al cargar tickets del supervisor:', err);
      setError('No se pudo cargar la bandeja de tickets asignados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="dashboard-app-layout"
      style={{ 
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.94), rgba(248, 250, 252, 0.94)), url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="supervisor-container">
          <header className="supervisor-header">
            <div>
              <h2>Panel de Tickets Asignados</h2>
              <p>Gestión y seguimiento de observaciones para subsanación de la empresa.</p>
            </div>
            <div className="supervisor-welcome-badge">
              <span>Supervisor: <strong>{usuario?.nombre || 'Externo'}</strong></span>
            </div>
          </header>

          {loading && <div className="supervisor-loading">Cargando tickets asignados...</div>}
          {error && <div className="supervisor-error">{error}</div>}

          {!loading && !error && tickets.length === 0 && (
            <div className="supervisor-empty">
              <p>No hay tickets pendientes de subsanación asignados a su empresa en este momento.</p>
            </div>
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="supervisor-table-card">
              <table className="supervisor-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Área</th>
                    <th>Prioridad</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((tk: any) => {
                    const estadoClass = tk.estado ? tk.estado.toLowerCase().replace(/\s+/g, '_') : '';
                    return (
                      <tr key={tk.id_ticket || tk.id}>
                        <td><strong>#{tk.cod_consulta_externa || tk.id_ticket}</strong></td>
                        <td>{tk.area_asignada || 'General'}</td>
                        <td>
                          <span className={`priority-badge ${tk.prioridad?.toLowerCase()}`}>
                            {tk.prioridad}
                          </span>
                        </td>
                        <td>{tk.fecha_vencimiento || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${estadoClass}`}>
                            {tk.estado}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => navigate(`/tickets/${tk.id_ticket || tk.id}`)}
                            className="btn-ver-detalle"
                          >
                            Gestionar / Subsanar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
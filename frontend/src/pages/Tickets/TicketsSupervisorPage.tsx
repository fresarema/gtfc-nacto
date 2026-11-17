import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './TicketsSupervisorPage.css';
import fondo from '../../assets/whiteBG.png';

interface TicketSupervisor {
  id_ticket: number;
  cod_consulta_externa?: string;
  fecha_creacion: string;
  fecha_vencimiento?: string;
  prioridad: string;
  estado: string;
  area_asignada?: string;
  empresa_asignada?: string;
}

export default function TicketsSupervisorPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketSupervisor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados de filtros
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  useEffect(() => {
    fetchTicketsSupervisor();
  }, []);

  const fetchTicketsSupervisor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await api.get('/tickets/supervisor/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(response.data || []);
    } catch (err: any) {
      console.error('Error al cargar los tickets del supervisor:', err);
      setError('No se pudieron obtener los tickets asociados a su empresa.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado por rango de fecha y estado
  const ticketsFiltrados = tickets.filter((t) => {
    const fechaItemBruta = t.fecha_creacion || '';
    const fechaItem = fechaItemBruta.substring(0, 10);

    if (fechaInicio && fechaItem < fechaInicio) return false;
    if (fechaFin && fechaItem > fechaFin) return false;

    if (estadoFiltro) {
      if (t.estado?.toLowerCase() !== estadoFiltro.toLowerCase()) return false;
    }

    return true;
  });

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setEstadoFiltro('');
  };

  return (
    <div 
      className="dashboard-app-layout"
      style={{ 
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.94), rgba(248, 250, 252, 0.94)), url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Navbar />

      <main className="dashboard-main-content supervisor-tickets-container">
        <header className="supervisor-header">
          <div>
            <h1 className="supervisor-title">Tickets de la Empresa</h1>
            <p className="supervisor-subtitle">
              {usuario?.empresa_nombre || usuario?.empresa_asignada 
                ? `Seguimiento de contratos para: ${usuario.empresa_nombre || usuario.empresa_asignada}` 
                : 'Panel de seguimiento y gestión de tickets asignados a su empresa'}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-volver-dash">
            ← Volver al Panel
          </button>
        </header>

        {error && <div className="supervisor-error">{error}</div>}

        {/* BARRA DE FILTROS */}
        <div className="filter-card-container">
          <div className="filter-label">
            Filtrar Tickets:
          </div>
          <div className="filter-group">
            <label>Desde:</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filter-date-input"
            />
          </div>
          <div className="filter-group">
            <label>Hasta:</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="filter-date-input"
            />
          </div>
          <div className="filter-group" style={{ flexGrow: 1, maxWidth: '240px' }}>
            <label>Estado:</label>
            <select 
              value={estadoFiltro} 
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="filter-date-input"
              style={{ width: '100%' }}
            >
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En revisión">En revisión</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          {(fechaInicio || fechaFin || estadoFiltro) && (
            <button onClick={limpiarFiltros} className="btn-clean-filter">
              Limpiar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="supervisor-loading">Cargando listado de tickets...</div>
        ) : (
          <div className="supervisor-table-card">
            <table className="supervisor-data-table">
              <thead>
                <tr>
                  <th>ID / CÓDIGO</th>
                  <th>FECHA CREACIÓN</th>
                  <th>VENCIMIENTO</th>
                  <th>PRIORIDAD</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.length > 0 ? (
                  ticketsFiltrados.map((tk) => (
                    <tr key={tk.id_ticket}>
                      <td className="font-mono">#{tk.cod_consulta_externa || tk.id_ticket}</td>
                      <td>{tk.fecha_creacion || 'N/D'}</td>
                      <td>{tk.fecha_vencimiento || 'N/D'}</td>
                      <td>
                        <span className={`badge-prioridad ${tk.prioridad?.toLowerCase()}`}>
                          {tk.prioridad || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-estado ${tk.estado?.toLowerCase().replace(/\s+/g, '_')}`}>
                          {tk.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/tickets/${tk.id_ticket}`)}
                          className="btn-link-detail"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-empty-table">
                      No hay tickets registrados para su empresa en este rango o filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
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

  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;

  useEffect(() => {
    fetchTicketsSupervisor();
  }, []);

  const fetchTicketsSupervisor = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const response = await api.get('/tickets/supervisor/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const lista = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];
      setTickets(lista);
    } catch (err: any) {
      console.error('Error al cargar los tickets del supervisor:', err);
      setError('No se pudieron obtener los tickets asociados a su empresa.');
    } finally {
      setLoading(false);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const fechaItem = (t.fecha_creacion || '').substring(0, 10);

    if (fechaInicio && fechaItem && fechaItem < fechaInicio) return false;
    if (fechaFin && fechaItem && fechaItem > fechaFin) return false;

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

  const normalizarClase = (valor?: string) =>
    (valor || 'normal').toLowerCase().trim().replace(/\s+/g, '_');

  return (
    <div
      className="dashboard-app-layout supervisor-page-bg"
      style={{
        backgroundImage: `url(${fondo})`,
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
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-volver-dash">
            ← Volver al Panel
          </button>
        </header>

        {error && <div className="supervisor-error">{error}</div>}

        <div className="list-filter-bar">
          <div className="filter-field">
            <label htmlFor="supervisor-desde">Desde</label>
            <input
              id="supervisor-desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="supervisor-hasta">Hasta</label>
            <input
              id="supervisor-hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div className="filter-field filter-field--grow">
            <label htmlFor="supervisor-estado">Estado</label>
            <select
              id="supervisor-estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto</option>
              <option value="En revisión">En revisión</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          {(fechaInicio || fechaFin || estadoFiltro) && (
            <button type="button" onClick={limpiarFiltros} className="btn-clear-filter">
              Limpiar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="supervisor-loading">Cargando listado de tickets...</div>
        ) : (
          <div className="supervisor-table-card">
            <div className="table-responsive-wrap">
              <table className="supervisor-data-table">
                <thead>
                  <tr>
                    <th>ID / CÓDIGO</th>
                    <th>FECHA CREACIÓN</th>
                    <th>VENCIMIENTO</th>
                    <th>PRIORIDAD</th>
                    <th>ESTADO</th>
                    <th className="th-action-right">ACCIONES</th>
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
                          <span className={`badge-prioridad ${normalizarClase(tk.prioridad)}`}>
                            {tk.prioridad || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-estado ${normalizarClase(tk.estado)}`}>
                            {tk.estado}
                          </span>
                        </td>
                        <td className="td-action-right">
                          <button
                            type="button"
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
          </div>
        )}
      </main>
    </div>
  );
}
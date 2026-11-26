import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './TicketsActivosPage.css';
import fondo from '../../assets/whiteBG.png';

interface Ticket {
  id: number;
  id_ticket: number;
  cod_consulta_externa: string;
  prioridad: string;
  descripcion: string;
  fecha_vencimiento: string;
  fecha_creacion: string;
  estado: string;
  empresa_nombre?: string;
  razon_social?: string;
}

interface EmpresaItem {
  id_empresa?: number;
  id?: number;
  razon_social?: string;
  nombre?: string;
}

export default function TicketsActivosPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [empresasCatalogo, setEmpresasCatalogo] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  const fetchTicketsActivos = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [ticketsRes, empresasRes] = await Promise.all([
        api.get('/tickets/supervisor/', { headers }),
        api.get('/empresas/', { headers }).catch(() => ({ data: [] })),
      ]);

      const todosLosTickets: Ticket[] = Array.isArray(ticketsRes.data)
        ? ticketsRes.data
        : Array.isArray(ticketsRes.data?.results)
          ? ticketsRes.data.results
          : [];

      const empresasData: EmpresaItem[] = Array.isArray(empresasRes.data)
        ? empresasRes.data
        : Array.isArray(empresasRes.data?.results)
          ? empresasRes.data.results
          : [];

      const nombresEmpresas = empresasData
        .map((emp) => emp.razon_social || emp.nombre || '')
        .filter(Boolean);

      setEmpresasCatalogo(nombresEmpresas);

      const ticketsNoCerrados = todosLosTickets.filter(
        (tk) => tk.estado?.toLowerCase() !== 'cerrado'
      );

      setTickets(ticketsNoCerrados);
    } catch (err: unknown) {
      console.error('Error al cargar tickets activos:', err);
      setError('No se pudieron cargar los tickets activos del sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsActivos();
  }, []);

  const listaEmpresas = useMemo(() => {
    const empresasSet = new Set<string>(empresasCatalogo);
    tickets.forEach((tk) => {
      const emp = tk.empresa_nombre || tk.razon_social;
      if (emp) empresasSet.add(emp);
    });
    return Array.from(empresasSet).sort((a, b) => a.localeCompare(b, 'es'));
  }, [empresasCatalogo, tickets]);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((tk) => {
      if (busquedaTexto.trim()) {
        const query = busquedaTexto.toLowerCase();
        const codigo = (tk.cod_consulta_externa || String(tk.id_ticket || tk.id)).toLowerCase();
        const desc = (tk.descripcion || '').toLowerCase();
        if (!codigo.includes(query) && !desc.includes(query)) {
          return false;
        }
      }

      if (estadoFiltro && tk.estado?.toLowerCase() !== estadoFiltro.toLowerCase()) {
        return false;
      }

      if (empresaFiltro) {
        const empNombre = tk.empresa_nombre || tk.razon_social || '';
        if (empNombre !== empresaFiltro) {
          return false;
        }
      }

      const fechaRef = (tk.fecha_vencimiento || tk.fecha_creacion || '').substring(0, 10);
      if (fechaInicio && fechaRef && fechaRef < fechaInicio) {
        return false;
      }
      if (fechaFin && fechaRef && fechaRef > fechaFin) {
        return false;
      }

      return true;
    });
  }, [tickets, busquedaTexto, estadoFiltro, empresaFiltro, fechaInicio, fechaFin]);

  const hayFiltrosActivos = Boolean(
    busquedaTexto.trim() || estadoFiltro || empresaFiltro || fechaInicio || fechaFin
  );

  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setEstadoFiltro('');
    setEmpresaFiltro('');
    setFechaInicio('');
    setFechaFin('');
  };

  const normalizarClase = (valor?: string) =>
    (valor || 'normal').toLowerCase().trim().replace(/\s+/g, '_');

  return (
    <div
      className="dashboard-app-layout tickets-page-bg"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <header className="main-header">
          <div>
            <h1 className="main-title">Bandeja de Tickets Activos</h1>
            <p className="main-subtitle">
              Listado general de fiscalizaciones pendientes, en proceso o en revisión
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-volver-dashboard"
          >
            Volver al panel principal
          </button>
        </header>

        <div className="list-filter-bar">
          <div className="filter-field filter-field--busqueda">
            <label htmlFor="filtro-ticket-busqueda">Buscar ticket</label>
            <input
              id="filtro-ticket-busqueda"
              type="text"
              placeholder="Código o descripción..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="filtro-ticket-estado">Estado</label>
            <select
              id="filtro-ticket-estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="">Seleccione un estado</option>
              <option value="Abierto">Abierto</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="filtro-ticket-empresa">Empresa</label>
            <select
              id="filtro-ticket-empresa"
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
            >
              <option value="">Seleccione una empresa</option>
              {listaEmpresas.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="filtro-ticket-desde">Desde</label>
            <input
              id="filtro-ticket-desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="filtro-ticket-hasta">Hasta</label>
            <input
              id="filtro-ticket-hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          {hayFiltrosActivos && (
            <div className="filter-actions">
              <button type="button" onClick={limpiarFiltros} className="btn-clear-filter">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {error && <div className="dashboard-error-banner">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-state">Cargando tickets activos...</div>
        ) : (
          <div className="table-card-container">
            <div className="table-header-title">
              <h3>
                Tickets Activos ({ticketsFiltrados.length} de {tickets.length})
              </h3>
            </div>
            <div className="table-responsive-wrap">
              <table className="dashboard-data-table">
                <thead>
                  <tr>
                    <th>ID / CÓDIGO</th>
                    <th>EMPRESA</th>
                    <th>PRIORIDAD</th>
                    <th>VENCIMIENTO</th>
                    <th>ESTADO</th>
                    <th className="th-action-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsFiltrados.length > 0 ? (
                    ticketsFiltrados.map((tk) => (
                      <tr key={tk.id_ticket || tk.id}>
                        <td className="font-mono">
                          #{tk.cod_consulta_externa || tk.id_ticket}
                        </td>
                        <td>{tk.empresa_nombre || tk.razon_social || 'N/A'}</td>
                        <td>
                          <span className={`badge-prioridad ${normalizarClase(tk.prioridad)}`}>
                            {tk.prioridad || 'Normal'}
                          </span>
                        </td>
                        <td>{tk.fecha_vencimiento || 'N/A'}</td>
                        <td>
                          <span className={`badge-estado ${normalizarClase(tk.estado)}`}>
                            {tk.estado}
                          </span>
                        </td>
                        <td className="td-action-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/tickets/${tk.id_ticket || tk.id}`)}
                            className="btn-table-action"
                          >
                            Ver Detalle →
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-empty-table">
                        No se encontraron tickets activos con los filtros aplicados.
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
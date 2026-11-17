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
  area_asignada: string;
  empresa_nombre?: string;
  razon_social?: string;
}

export default function TicketsActivosPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados para los filtros originales
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  useEffect(() => {
    fetchTicketsActivos();
  }, []);

  const fetchTicketsActivos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.get('/tickets/supervisor/', { headers });
      const todosLosTickets: Ticket[] = response.data || [];

      // Filtramos de forma estricta para asegurar que no se listen cerrados si es una bandeja activa
      const ticketsNoCerrados = todosLosTickets.filter(
        (tk) => tk.estado?.toLowerCase() !== 'cerrado'
      );

      setTickets(ticketsNoCerrados);
    } catch (err: any) {
      console.error('Error al cargar tickets activos:', err);
      setError('No se pudieron cargar los tickets activos del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const listaEmpresas = useMemo(() => {
    const empresasSet = new Set<string>();
    tickets.forEach((tk) => {
      const emp = tk.empresa_nombre || tk.razon_social;
      if (emp) empresasSet.add(emp);
    });
    return Array.from(empresasSet);
  }, [tickets]);

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

      const fechaRef = tk.fecha_vencimiento || tk.fecha_creacion || '';
      if (fechaInicio && fechaRef && fechaRef < fechaInicio) {
        return false;
      }
      if (fechaFin && fechaRef && fechaRef > fechaFin) {
        return false;
      }

      return true;
    });
  }, [tickets, busquedaTexto, estadoFiltro, empresaFiltro, fechaInicio, fechaFin]);

  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setEstadoFiltro('');
    setEmpresaFiltro('');
    setFechaInicio('');
    setFechaFin('');
  };

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
            <p className="main-subtitle">Listado general de fiscalizaciones pendientes, en proceso o en revisión</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-volver-dashboard">
            ← Volver al Dashboard
          </button>
        </header>

        {/* BARRA DE FILTROS */}
        <div className="filter-card-container">
          <span className="filter-label">Filtrar Registros</span>

          <div className="filter-group">
            <label>Buscar</label>
            <input 
              type="text"
              placeholder="Ej: #TK-2026..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="filter-input-text"
            />
          </div>

          <div className="filter-group">
            <label>Estado</label>
            <select 
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos</option>
              <option value="Abierto">Abierto</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Empresa</label>
            <select 
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas</option>
              {listaEmpresas.map((emp, idx) => (
                <option key={idx} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Desde</label>
            <input 
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filter-date-input"
            />
          </div>

          <div className="filter-group">
            <label>Hasta</label>
            <input 
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="filter-date-input"
            />
          </div>

          <button onClick={limpiarFiltros} className="btn-clean-filter">
            Limpiar
          </button>
        </div>

        {error && <div className="dashboard-error-banner">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-state">Cargando tickets activos...</div>
        ) : (
          <div className="table-card-container">
            <div className="table-header-title">
              <h3>Tickets en Curso ({ticketsFiltrados.length} de {tickets.length})</h3>
            </div>
            <table className="dashboard-data-table">
              <thead>
                <tr>
                  <th>ID / CÓDIGO</th>
                  <th>ÁREA</th>
                  <th>EMPRESA</th>
                  <th>PRIORIDAD</th>
                  <th>VENCIMIENTO</th>
                  <th>ESTADO</th>
                  <th className="th-action-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {ticketsFiltrados.length > 0 ? (
                  ticketsFiltrados.map((tk) => {
                    const esCerrado = tk.estado?.toLowerCase() === 'cerrado';
                    return (
                      <tr key={tk.id_ticket || tk.id}>
                        <td className="font-mono">#{tk.cod_consulta_externa || tk.id_ticket}</td>
                        <td>{tk.area_asignada || 'General'}</td>
                        <td>{tk.empresa_nombre || tk.razon_social || 'N/A'}</td>
                        <td>
                          <span className={`badge-prioridad ${tk.prioridad?.toLowerCase()}`}>
                            {tk.prioridad || 'Normal'}
                          </span>
                        </td>
                        <td>{tk.fecha_vencimiento || 'N/A'}</td>
                        <td>
                          <span className={`badge-estado ${tk.estado?.toLowerCase().replace(/\s+/g, '_')}`}>
                            {tk.estado}
                          </span>
                        </td>
                        <td className="td-action-right">
                          {esCerrado ? (
                            <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                              Cerrado (Bloqueado)
                            </span>
                          ) : (
                            <button
                              onClick={() => navigate(`/tickets/${tk.id_ticket || tk.id}`)}
                              className="btn-table-action"
                            >
                              Ver Detalle →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-empty-table">
                      No se encontraron tickets activos con los filtros aplicados.
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
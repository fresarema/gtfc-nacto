import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './TicketsCerradosPage.css';
import fondo from '../../assets/whiteBG.png';

interface TicketCerrado {
  id_ticket: number;
  cod_consulta_externa?: string;
  fecha_creacion: string;
  fecha_vencimiento?: string;
  empresa_asignada?: string;
  razon_social?: string;
  estado: string;
  prioridad: string;
}

interface EmpresaFiltroItem {
  id_empresa?: number;
  id?: number;
  razon_social?: string;
  nombre?: string;
}

export default function TicketsCerradosPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketCerrado[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaFiltroItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const elementosPorPagina = 10;

  useEffect(() => {
    fetchEmpresas();
    fetchTicketsCerrados();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/empresas/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const lista = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];
      setEmpresas(lista);
    } catch (err) {
      console.error('Error al cargar empresas para filtros:', err);
    }
  };

  const fetchTicketsCerrados = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const response = await api.get('/tickets/supervisor/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];
      const cerrados = data.filter((t: TicketCerrado) => t.estado?.toLowerCase() === 'cerrado');
      setTickets(cerrados);
    } catch (err: any) {
      console.error('Error al cargar historial de tickets cerrados:', err);
      setError('No se pudo cargar el historial de tickets.');
    } finally {
      setLoading(false);
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
    const fechaItem = (t.fecha_creacion || '').substring(0, 10);
    if (!fechaItem) return false;

    if (fechaInicio && fechaItem < fechaInicio) return false;
    if (fechaFin && fechaItem > fechaFin) return false;

    if (empresaSeleccionada) {
      const empresaStr = (t.empresa_asignada || t.razon_social || '').toLowerCase();
      const matchId = String(t.empresa_asignada) === String(empresaSeleccionada);
      const matchRazon = empresaStr.includes(empresaSeleccionada.toLowerCase());
      if (!matchId && !matchRazon) return false;
    }

    return true;
  });

  const totalPaginas = Math.ceil(ticketsFiltrados.length / elementosPorPagina) || 1;
  const indiceUltimoElemento = paginaActual * elementosPorPagina;
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
  const ticketsPaginados = ticketsFiltrados.slice(indicePrimerElemento, indiceUltimoElemento);

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setEmpresaSeleccionada('');
    setPaginaActual(1);
  };

  const normalizarPrioridad = (prioridad?: string) =>
    (prioridad || 'normal').toLowerCase().trim().replace(/\s+/g, '_');

  return (
    <div
      className="dashboard-app-layout historial-page-bg"
      style={{
        backgroundImage: `url(${fondo})`,
      }}
    >
      <Navbar />

      <main className="dashboard-main-content tickets-historial-container">
        <header className="historial-header">
          <div>
            <h1 className="historial-title">Historial de Tickets Cerrados</h1>
            <p className="historial-subtitle">Consulta de registros finalizados con opciones de filtrado y paginación</p>
          </div>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-volver-dash">
            Volver al panel principal
          </button>
        </header>

        {error && <div className="historial-error">{error}</div>}

        <div className="list-filter-bar">
          <div className="filter-field">
            <label htmlFor="cerrados-desde">Desde</label>
            <input
              id="cerrados-desde"
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="cerrados-hasta">Hasta</label>
            <input
              id="cerrados-hasta"
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPaginaActual(1);
              }}
            />
          </div>

          <div className="filter-field filter-field--grow">
            <label htmlFor="cerrados-empresa">Empresa</label>
            <select
              id="cerrados-empresa"
              value={empresaSeleccionada}
              onChange={(e) => {
                setEmpresaSeleccionada(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Todas las empresas</option>
              {empresas.map((emp, idx) => {
                const nombreEmp = emp.razon_social || emp.nombre || '';
                if (!nombreEmp) return null;
                return (
                  <option key={emp.id_empresa ?? emp.id ?? idx} value={nombreEmp}>
                    {nombreEmp}
                  </option>
                );
              })}
            </select>
          </div>

          {(fechaInicio || fechaFin || empresaSeleccionada) && (
            <button type="button" onClick={limpiarFiltros} className="btn-clear-filter">
              Limpiar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="historial-loading">Cargando historial de tickets...</div>
        ) : (
          <div className="historial-table-card">
            <div className="table-responsive-wrap">
              <table className="historial-data-table">
                <thead>
                  <tr>
                    <th>ID / CÓDIGO</th>
                    <th>FECHA CREACIÓN</th>
                    <th>EMPRESA ASIGNADA</th>
                    <th>PRIORIDAD</th>
                    <th>ESTADO</th>
                    <th className="th-action-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsPaginados.length > 0 ? (
                    ticketsPaginados.map((tk) => (
                      <tr key={tk.id_ticket}>
                        <td className="font-mono">#{tk.cod_consulta_externa || tk.id_ticket}</td>
                        <td>{tk.fecha_creacion || 'N/D'}</td>
                        <td>{tk.empresa_asignada || tk.razon_social || 'General'}</td>
                        <td>
                          <span className={`badge-prioridad ${normalizarPrioridad(tk.prioridad)}`}>
                            {tk.prioridad || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className="badge-estado cerrado">{tk.estado}</span>
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
                        No se encontraron tickets cerrados con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="pagination-container">
                <button
                  type="button"
                  onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="btn-page"
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="btn-page"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
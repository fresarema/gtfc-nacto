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

export default function TicketsCerradosPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketCerrado[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados de filtros
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>('');

  // Estados de paginación
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
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresas(response.data || []);
    } catch (err) {
      console.error('Error al cargar empresas para filtros:', err);
    }
  };

  const fetchTicketsCerrados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await api.get('/tickets/supervisor/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data || [];
      const cerrados = data.filter((t: any) => t.estado?.toLowerCase() === 'cerrado');
      setTickets(cerrados);
    } catch (err: any) {
      console.error('Error al cargar historial de tickets cerrados:', err);
      setError('No se pudo cargar el historial de tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de filtrado robusta para fechas y empresa
  const ticketsFiltrados = tickets.filter((t) => {
    const fechaItemBruta = t.fecha_creacion || '';
    // Normalizamos la fecha del ticket a 'YYYY-MM-DD' cortando los primeros 10 caracteres
    const fechaItem = fechaItemBruta.substring(0, 10);

    if (!fechaItem) return false;

    // Filtro por fecha de inicio (>=)
    if (fechaInicio && fechaItem < fechaInicio) return false;
    
    // Filtro por fecha de fin (<=)
    if (fechaFin && fechaItem > fechaFin) return false;
    
    // Filtro por empresa
    if (empresaSeleccionada) {
      const empresaStr = (t.empresa_asignada || t.razon_social || '').toLowerCase();
      const matchId = String(t.empresa_asignada) === String(empresaSeleccionada);
      const matchRazon = empresaStr.includes(empresaSeleccionada.toLowerCase());
      if (!matchId && !matchRazon) return false;
    }

    return true;
  });

  // Lógica de Paginación
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

      <main className="dashboard-main-content tickets-historial-container">
        <header className="historial-header">
          <div>
            <h1 className="historial-title">Historial de Tickets Cerrados</h1>
            <p className="historial-subtitle">Consulta de registros finalizados con opciones de filtrado y paginación</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn-volver-dash">
            ← Volver al Panel
          </button>
        </header>

        {error && <div className="historial-error">{error}</div>}

        {/* BARRA DE FILTROS */}
        <div className="filter-card-container">
          <div className="filter-label">
             Filtrar Historial:
          </div>
          <div className="filter-group">
            <label>Desde:</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => { setFechaInicio(e.target.value); setPaginaActual(1); }}
              className="filter-date-input"
            />
          </div>
          <div className="filter-group">
            <label>Hasta:</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => { setFechaFin(e.target.value); setPaginaActual(1); }}
              className="filter-date-input"
            />
          </div>
          <div className="filter-group" style={{ flexGrow: 1, maxWidth: '280px' }}>
            <label>Empresa:</label>
            <select 
              value={empresaSeleccionada} 
              onChange={(e) => { setEmpresaSeleccionada(e.target.value); setPaginaActual(1); }}
              className="filter-date-input"
              style={{ width: '100%' }}
            >
              <option value="">Todas las empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id_empresa} value={emp.razon_social}>
                  {emp.razon_social}
                </option>
              ))}
            </select>
          </div>
          {(fechaInicio || fechaFin || empresaSeleccionada) && (
            <button onClick={limpiarFiltros} className="btn-clean-filter">
              Limpiar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="historial-loading">Cargando historial de tickets...</div>
        ) : (
          <div className="historial-table-card">
            <table className="historial-data-table">
              <thead>
                <tr>
                  <th>ID / CÓDIGO</th>
                  <th>FECHA CREACIÓN</th>
                  <th>EMPRESA ASIGNADA</th>
                  <th>PRIORIDAD</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
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
                        <span className={`badge-prioridad ${tk.prioridad?.toLowerCase()}`}>
                          {tk.prioridad || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <span className="badge-estado cerrado">
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
                      No se encontraron tickets cerrados con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="pagination-container">
                <button 
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
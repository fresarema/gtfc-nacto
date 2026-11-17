import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './DashboardPage.css';
import fondo from '../../assets/whiteBG.png';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para ordenar por fecha
  const [ordenTickets, setOrdenTickets] = useState<'asc' | 'desc'>('desc');
  const [ordenObservaciones, setOrdenObservaciones] = useState<'asc' | 'desc'>('desc');

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resTickets, resObs] = await Promise.all([
        api.get('/tickets/supervisor/', { headers }),
        api.get('/observaciones/', { headers }).catch(() => ({ data: [] }))
      ]);

      setTickets(resTickets.data || []);
      setObservaciones(resObs.data || []);
    } catch (err: any) {
      console.error('Error al cargar datos del dashboard:', err);
      setError('No se pudieron cargar los registros del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const ordenarRegistros = (lista: any[], campoFecha: string, orden: 'asc' | 'desc') => {
    return [...lista].sort((a, b) => {
      const fechaA = a[campoFecha] || '';
      const fechaB = b[campoFecha] || '';
      if (orden === 'asc') {
        return fechaA.localeCompare(fechaB);
      } else {
        return fechaB.localeCompare(fechaA);
      }
    });
  };

  const ticketsOrdenados = ordenarRegistros(tickets, 'fecha_creacion', ordenTickets).slice(0, 5);
  const observacionesOrdenadas = ordenarRegistros(observaciones, 'fecha_registro', ordenObservaciones).slice(0, 5);

  const totalTickets = tickets.length;
  const cerradosCount = tickets.filter((t: any) => t.estado?.toLowerCase() === 'cerrado').length;
  const enRevisionCount = tickets.filter((t: any) => ['en revisión', 'en_revision'].includes(t.estado?.toLowerCase())).length;
  const pendientesCount = tickets.filter((t: any) => ['abierto', 'pendiente'].includes(t.estado?.toLowerCase())).length;
  const totalObservaciones = observaciones.length;

  // Configuración de datos para el Gráfico de Dona (Estados de Tickets)
  const doughnutData = {
    labels: ['Cerrados', 'En Revisión', 'Pendientes / Abiertos'],
    datasets: [
      {
        data: [cerradosCount, enRevisionCount, pendientesCount],
        backgroundColor: ['#16a34a', '#0284c7', '#ca8a04'],
        borderWidth: 1,
      },
    ],
  };

  // Configuración de datos para el Gráfico de Barras (Volumen General)
  const barData = {
    labels: ['Total Tickets', 'Cerrados', 'En Revisión', 'Observaciones Terreno'],
    datasets: [
      {
        label: 'Métricas del Sistema',
        data: [totalTickets, cerradosCount, enRevisionCount, totalObservaciones],
        backgroundColor: ['#0f172a', '#16a34a', '#0284c7', '#64748b'],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'system-ui', size: 12 },
          color: '#334155',
        },
      },
    },
  };

  return (
    <div 
      className="dashboard-app-layout"
      style={{ 
        backgroundImage: `url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <header className="main-header">
          <div>
            <h1 className="main-title">Panel de Control y Fiscalización</h1>
            <p className="main-subtitle">
              {rol.includes('supervisor') 
                ? 'Vista de seguimiento para su empresa asignada' 
                : 'Gestión municipal de contratos y validación de terreno'}
            </p>
          </div>
          {['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol) && (
            <button onClick={() => navigate('/observaciones/nueva')} className="btn-create-ticket">
              + Crear Nueva Observación
            </button>
          )}
        </header>

        {error && <div className="dashboard-error-banner">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-state">Cargando registros...</div>
        ) : (
          <>
            {/* Tarjetas KPI */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-title">Total Tickets</span>
                <span className="kpi-value">{totalTickets}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">En Revisión</span>
                <span className="kpi-value">{enRevisionCount}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">Cerrados</span>
                <span className="kpi-value">{cerradosCount}</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">Observaciones Terreno</span>
                <span className="kpi-value">{totalObservaciones}</span>
              </div>
            </div>

            {/* SECCIÓN DE GRÁFICOS ANALÍTICOS */}
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Distribución de Estados de Tickets</h3>
                </div>
                <div className="chart-container">
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Volumen General de Operaciones</h3>
                </div>
                <div className="chart-container">
                  <Bar data={barData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="dual-tables-grid">
              
              <div className="table-card-container">
                <div className="table-header-title">
                  <h3>Últimos 5 Tickets Creados</h3>
                </div>
                <table className="dashboard-data-table">
                  <thead>
                    <tr>
                      <th>ID / CÓDIGO</th>
                      <th>
                        <button 
                          className="th-sort-btn"
                          onClick={() => setOrdenTickets(ordenTickets === 'asc' ? 'desc' : 'asc')}
                        >
                          FECHA {ordenTickets === 'asc' ? '▲' : '▼'}
                        </button>
                      </th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsOrdenados.length > 0 ? (
                      ticketsOrdenados.map((tk: any) => (
                        <tr 
                          key={tk.id_ticket || tk.id} 
                          onClick={() => navigate(`/tickets/${tk.id_ticket || tk.id}`)}
                          style={{ cursor: 'pointer' }}
                          title="Hacer clic para ver detalle"
                        >
                          <td className="font-mono">#{tk.cod_consulta_externa || tk.id_ticket || tk.id}</td>
                          <td>{tk.fecha_creacion || tk.fecha_vencimiento || 'N/D'}</td>
                          <td>
                            <span className={`badge-estado ${tk.estado?.toLowerCase().replace(/\s+/g, '_')}`}>
                              {tk.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-empty-table">
                          No hay tickets registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-card-container">
                <div className="table-header-title">
                  <h3>Últimas 5 Observaciones</h3>
                </div>
                <table className="dashboard-data-table">
                  <thead>
                    <tr>
                      <th>ID OBS</th>
                      <th>
                        <button 
                          className="th-sort-btn"
                          onClick={() => setOrdenObservaciones(ordenObservaciones === 'asc' ? 'desc' : 'asc')}
                        >
                          FECHA {ordenObservaciones === 'asc' ? '▲' : '▼'}
                        </button>
                      </th>
                      <th>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observacionesOrdenadas.length > 0 ? (
                      observacionesOrdenadas.map((obs: any) => (
                        <tr key={obs.id_observacion || obs.id}>
                          <td className="font-mono">#{obs.id_observacion || obs.id}</td>
                          <td>{obs.fecha_registro || 'N/D'}</td>
                          <td>
                            <span className={`badge-estado ${obs.estado?.toLowerCase().replace(/\s+/g, '_')}`}>
                              {obs.estado}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-empty-table">
                          No hay observaciones registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
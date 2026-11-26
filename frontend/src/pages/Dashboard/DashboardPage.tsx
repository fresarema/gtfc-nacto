import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './DashboardPage.css';
import fondo from '../../assets/whiteBG.png';
import NotificacionesModal from '../../components/NotificacionesModal/NotificacionesModal';
import MapaZonasImpacto, {
  type ComandoVistaMapa,
  type NivelImpacto,
  type TicketMapaItem,
  type ZonaImpactoItem,
} from '../../components/MapaZonasImpacto/MapaZonasImpacto';

// Importaciones necesarias para Chart.js
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

type VistaDashboardModo = 'metricas' | 'mapa' | 'movimientos';

const CENTRO_POR_DEFECTO: [number, number] = [-37.4689, -72.3527];

function extraerCoordenadasTicket(tk: any): { lat: number; lng: number } | null {
  const latDirecta = Number(tk?.latitud);
  const lngDirecta = Number(tk?.longitud);
  if (
    Number.isFinite(latDirecta) &&
    Number.isFinite(lngDirecta) &&
    latDirecta >= -90 &&
    latDirecta <= 90 &&
    lngDirecta >= -180 &&
    lngDirecta <= 180
  ) {
    return { lat: latDirecta, lng: lngDirecta };
  }

  const textoUbicacion = tk?.ubicacion_observacion;
  if (typeof textoUbicacion === 'string') {
    const matches = textoUbicacion.match(/-?\d+(?:[.,]\d+)?/g);
    if (matches && matches.length >= 2) {
      const lat = Number(matches[0].replace(',', '.'));
      const lng = Number(matches[1].replace(',', '.'));
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        return { lat, lng };
      }
    }
  }

  return null;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 3 vistas independientes: métricas (KPIs + gráficos), mapa o últimos movimientos (tablas)
  const [vistaModo, setVistaModo] = useState<VistaDashboardModo>('metricas');
  const [comandoVistaMapa, setComandoVistaMapa] = useState<ComandoVistaMapa | null>(null);

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

  const { zonasImpacto, centroMapa, puntosMapa } = useMemo(() => {
    const mapaGrupos = new Map<
      string,
      { latSuma: number; lngSuma: number; tickets: TicketMapaItem[] }
    >();
    const puntos: [number, number][] = [];

    tickets.forEach((tk: any, idx: number) => {
      const coords = extraerCoordenadasTicket(tk);
      if (!coords) return;

      puntos.push([coords.lat, coords.lng]);
      const clave = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
      const itemTicket: TicketMapaItem = {
        idClave: String(tk.id_ticket || tk.id || idx),
        codigo: String(tk.cod_consulta_externa || tk.id_ticket || tk.id || idx + 1),
        lat: coords.lat,
        lng: coords.lng,
        estado: String(tk.estado || 'Abierto'),
        empresa: String(tk.empresa_nombre || tk.empresa_asignada || tk.razon_social || 'Sin empresa'),
      };

      const grupoActual = mapaGrupos.get(clave);
      if (grupoActual) {
        grupoActual.latSuma += coords.lat;
        grupoActual.lngSuma += coords.lng;
        grupoActual.tickets.push(itemTicket);
      } else {
        mapaGrupos.set(clave, {
          latSuma: coords.lat,
          lngSuma: coords.lng,
          tickets: [itemTicket],
        });
      }
    });

    const zonas: ZonaImpactoItem[] = Array.from(mapaGrupos.entries()).map(([clave, g]) => {
      const cantidad = g.tickets.length;
      const nivel: NivelImpacto = cantidad >= 4 ? 'alto' : cantidad >= 2 ? 'medio' : 'bajo';
      return {
        idZona: clave,
        lat: g.latSuma / cantidad,
        lng: g.lngSuma / cantidad,
        cantidad,
        nivel,
        tickets: g.tickets,
      };
    });

    const centro: [number, number] =
      puntos.length > 0 ? [puntos[0][0], puntos[0][1]] : CENTRO_POR_DEFECTO;

    return { zonasImpacto: zonas, centroMapa: centro, puntosMapa: puntos };
  }, [tickets]);

  const handleSeleccionarModo = (modo: VistaDashboardModo) => {
    setVistaModo(modo);
    if (modo === 'mapa' && puntosMapa.length > 0) {
      setComandoVistaMapa({
        tipo: puntosMapa.length > 1 ? 'bounds' : 'flyTo',
        coords: puntosMapa[0],
        zoom: 13,
        puntos: puntosMapa,
        nonce: Date.now(),
      });
    }
  };

  const doughnutData = {
    labels: ['Cerrados', 'En Revisión', 'Pendientes / Abiertos'],
    datasets: [
      {
        data: [cerradosCount, enRevisionCount, pendientesCount],
        backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['Total Tickets', 'Cerrados', 'En Revisión', 'Observaciones Terreno'],
    datasets: [
      {
        label: 'Métricas del Sistema',
        data: [totalTickets, cerradosCount, enRevisionCount, totalObservaciones],
        backgroundColor: ['#0f172a', '#10b981', '#6366f1', '#64748b'],
        borderRadius: 8,
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
          font: { family: 'Inter', size: 12 },
          color: '#334155',
          boxWidth: 12,
          padding: 16,
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

          <div className="header-actions-group">
            <NotificacionesModal />
            {['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol) && (
              <button onClick={() => navigate('/observaciones/nueva')} className="btn-create-ticket">
                + Crear Nueva Observación
              </button>
            )}
          </div>
        </header>

        <div className="dashboard-view-switchbar" role="group" aria-label="Secciones del panel">
          <button
            type="button"
            onClick={() => handleSeleccionarModo('metricas')}
            className={`dashboard-switch-btn ${vistaModo === 'metricas' ? 'is-active' : ''}`}
          >
            Métricas
          </button>
          <button
            type="button"
            onClick={() => handleSeleccionarModo('mapa')}
            className={`dashboard-switch-btn ${vistaModo === 'mapa' ? 'is-active' : ''}`}
          >
            Mapa de Impacto ({zonasImpacto.length})
          </button>
          <button
            type="button"
            onClick={() => handleSeleccionarModo('movimientos')}
            className={`dashboard-switch-btn ${vistaModo === 'movimientos' ? 'is-active' : ''}`}
          >
            Últimos Movimientos
          </button>
        </div>

        {error && <div className="dashboard-error-banner">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-state">Cargando registros...</div>
        ) : (
          <>
            {vistaModo === 'metricas' && (
              <>
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
              </>
            )}

            {vistaModo === 'mapa' && (
              <section className="dashboard-mapa-section" aria-label="Mapa de impacto en el panel">
                <div className="dashboard-mapa-header">
                  <div>
                    <h3>Mapa de Impacto de Tickets</h3>
                    <p>
                      Zonas georreferenciadas según las ubicaciones registradas en los tickets.
                    </p>
                  </div>
                </div>

                {zonasImpacto.length > 0 ? (
                  <div className="mapa-grid">
                    <MapaZonasImpacto
                      zonas={zonasImpacto}
                      centro={centroMapa}
                      zoomInicial={13}
                      comandoVista={comandoVistaMapa}
                      onVerTicket={(idTicket) => navigate(`/tickets/${idTicket}`)}
                    />

                    <aside className="mapa-side-card">
                      <h2 className="mapa-side-title">Mayor concentración</h2>

                      <div className="mapa-zona-list">
                        {zonasImpacto.slice(0, 6).map((zona, index) => (
                          <div key={zona.idZona} className="mapa-zona-item">
                            <button
                              type="button"
                              onClick={() =>
                                setComandoVistaMapa({
                                  tipo: 'flyTo',
                                  coords: [zona.lat, zona.lng],
                                  zoom: 15,
                                  nonce: Date.now(),
                                })
                              }
                              className="mapa-zona-btn"
                              title="Centrar mapa en esta zona"
                            >
                              <div className="mapa-zona-head">
                                <span className="mapa-zona-index">#{index + 1}</span>
                                <span className={`mapa-zona-pill is-${zona.nivel}`}>
                                  {zona.cantidad} {zona.cantidad === 1 ? 'ticket' : 'tickets'}
                                </span>
                              </div>
                              <div className="mapa-zona-coords">
                                {zona.lat.toFixed(5)}, {zona.lng.toFixed(5)}
                              </div>
                              <div className="mapa-zona-sub">
                                {Array.from(new Set(zona.tickets.map((t) => t.empresa))).join(', ')}
                              </div>
                            </button>

                            <ul className="mapa-zona-tickets">
                              {zona.tickets.map((tk) => (
                                <li key={tk.idClave}>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/tickets/${tk.idClave}`)}
                                    className="mapa-ticket-link-btn"
                                  >
                                    <span>#{tk.codigo}</span>
                                    <span className="mapa-ticket-empresa">{tk.empresa}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>
                ) : (
                  <div className="dashboard-mapa-empty">
                    No hay tickets con coordenadas geográficas válidas para mostrar en el mapa.
                  </div>
                )}
              </section>
            )}

            {vistaModo === 'movimientos' && (
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
            )}
          </>
        )}
      </main>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BandejaMunicipal.module.css';

interface Ubicacion {
  direccion?: string;
  latitud?: number;
  longitud?: number;
}

interface ItemBandeja {
  id?: number;
  id_observacion?: number;
  id_ticket?: number;
  cod_consulta_externa?: string;
  titulo?: string;
  nombre?: string;
  descripcion?: string;
  observacion?: string;
  ubicacion_observacion?: string | Ubicacion;
  ubicacion?: string;
  estado?: string;
  fecha?: string;
  fecha_registro?: string;
  prioridad?: string;
  area_asignada?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

const checkIsSupervisor = (): boolean => {
  const role = (localStorage.getItem('role') || localStorage.getItem('user_role') || localStorage.getItem('userRole') || '').toLowerCase();
  const userType = (localStorage.getItem('user_type') || localStorage.getItem('tipo_usuario') || '').toLowerCase();

  if (
    role.includes('supervisor') || role.includes('empresa') ||
    userType.includes('supervisor') || userType.includes('empresa')
  ) {
    return true;
  }

  try {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(atob(payloadBase64));
        const jwtRole = (
          decoded.role || 
          decoded.user_type || 
          decoded.tipo_usuario || 
          decoded.rol || 
          ''
        ).toLowerCase();
        
        if (jwtRole.includes('supervisor') || jwtRole.includes('empresa')) {
          return true;
        }
      }
    }
  } catch {
    // Si falla el parseo
  }

  return false;
};

export const BandejaMunicipal: React.FC = () => {
  const navigate = useNavigate();
  const isSupervisor = checkIsSupervisor();

  const [items, setItems] = useState<ItemBandeja[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };

        // Obtenemos los tickets oficiales activos desde el backend[cite: 4]
        const res = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
        if (!res.ok) throw new Error('No se pudieron obtener los tickets del sistema');
        
        const data = await res.json();
        const listaTickets = Array.isArray(data) ? data : data.results || [];
        
        // Excluimos tickets cerrados o resueltos para mostrar solo los activos en el panel[cite: 4]
        const ticketsActivos = listaTickets.filter((tk: ItemBandeja) => {
          const estadoLower = String(tk.estado || '').toLowerCase().trim();
          return estadoLower !== 'cerrado' && estadoLower !== 'resuelto';
        });

        setItems(ticketsActivos);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al conectar con el servidor');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderUbicacion = (ubicacionObs?: string | Ubicacion, ubicacionAlt?: string) => {
    if (ubicacionObs) {
      if (typeof ubicacionObs === 'string') return ubicacionObs;
      if (typeof ubicacionObs === 'object') {
        if (ubicacionObs.direccion) return ubicacionObs.direccion;
        if (ubicacionObs.latitud && ubicacionObs.longitud) {
          return `Lat: ${ubicacionObs.latitud}, Lng: ${ubicacionObs.longitud}`;
        }
      }
    }
    return ubicacionAlt || 'Sin dirección registrada';
  };

  // Cálculo de KPIs basados en los tickets activos[cite: 4]
  const totalRegistros = items.length;
  const pendientes = items.filter(
    (item) => !item.estado || item.estado.toLowerCase() === 'pendiente' || item.estado.toLowerCase() === 'abierto'
  );
  const enRevision = items.filter(
    (item) => item.estado && (item.estado.toLowerCase() === 'en revisión' || item.estado.toLowerCase() === 'en proceso' || item.estado.toLowerCase() === 'subsanado')
  );

  const pendientesCount = pendientes.length;
  const revisionCount = enRevision.length;

  const ultimosItems = [...items]
    .sort((a, b) => {
      const idA = a.id_ticket ?? a.id ?? 0;
      const idB = b.id_ticket ?? b.id ?? 0;
      return idB - idA;
    })
    .slice(0, 5);

  const handleNavegarDetalle = (item: ItemBandeja) => {
    const realId = item.id_ticket ?? item.id;
    if (isSupervisor) {
      navigate(`/subsanacion/${realId}`);
    } else {
      navigate(`/detalle-ticket/${realId}`);
    }
  };

  if (loading) return <div className={styles.container}>Cargando indicadores y registros...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Bandeja Municipal - Panel de Control</h1>
        <p>Resumen general de estado e indicadores de fiscalización</p>
      </header>

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiTotal}`}>
          <h3>Total Activos</h3>
          <p className={styles.kpiNumber}>{totalRegistros}</p>
          <span className={styles.kpiSubtitle}>Tickets oficiales en curso</span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiPending}`}>
          <h3>Pendientes / Abiertos</h3>
          <p className={styles.kpiNumber}>{pendientesCount}</p>
          <span className={styles.kpiSubtitle}>Requieren atención inicial</span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCompleted}`}>
          <h3>En Revisión / Proceso</h3>
          <p className={styles.kpiNumber}>{revisionCount}</p>
          <span className={styles.kpiSubtitle}>Evidencia enviada / auditando</span>
        </div>
      </div>

      <div className={styles.recentSection}>
        <h2>Últimos Tickets Activos</h2>
        {ultimosItems.length === 0 ? (
          <p className={styles.emptyText}>No hay registros activos en este momento.</p>
        ) : (
          <ul className={styles.recentList}>
            {ultimosItems.map((item, index) => {
              const itemId = item.cod_consulta_externa || item.id_ticket || item.id || (index + 1);
              const itemKey = `item-${itemId}-${index}`;
              const direccionStr = renderUbicacion(item.ubicacion_observacion, item.ubicacion);
              const tituloOTexto = item.titulo || item.nombre || item.descripcion || item.observacion || 'Sin descripción';

              return (
                <li key={itemKey} className={styles.recentItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                  <div>
                    <span><strong># {itemId}</strong> - {tituloOTexto}</span>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>{direccionStr}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={styles.badge}>{item.estado || 'Abierto'}</span>
                    <button 
                      onClick={() => handleNavegarDetalle(item)}
                      style={{ padding: '0.5rem 1rem', background: '#01497c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Ver Detalle / Gestionar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BandejaMunicipal;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getObservations } from '../../services/api';
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
  titulo?: string;
  nombre?: string;
  descripcion?: string;
  observacion?: string;
  ubicacion_observacion?: string | Ubicacion;
  ubicacion?: string;
  estado?: string;
  fecha?: string;
  fecha_registro?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

/**
 * Función helper para verificar si el usuario logueado es Supervisor / Empresa
 */
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
  } catch (e) {
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
        if (isSupervisor) {
          // SUPERVISOR: Carga sus tickets/subsanaciones asignadas
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          };

          const res = await fetch(`${API_BASE_URL}/api/tickets/supervisor/`, { headers });
          if (!res.ok) throw new Error('No se pudieron obtener las subsanaciones asignadas');
          const data = await res.json();
          setItems(Array.isArray(data) ? data : data.results || []);
        } else {
          // MUNICIPAL / ADMIN: Carga las observaciones ingresadas por inspectores para aprobación
          const data = await getObservations();
          setItems(data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSupervisor]);

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

  // Filtrar exclusivamente los pendientes
  const pendientes = items.filter(
    (item) => !item.estado || item.estado.toLowerCase() === 'pendiente' || item.estado.toLowerCase() === 'abierto'
  );

  const totalRegistros = items.length;
  const pendientesCount = pendientes.length;
  const atendidasCount = totalRegistros - pendientesCount;

  // Tomar únicamente los últimos 5 pendientes ordenados descendentemente
  const ultimasPendientes = [...pendientes]
    .sort((a, b) => {
      const idA = a.id_observacion ?? a.id_ticket ?? a.id ?? 0;
      const idB = b.id_observacion ?? b.id_ticket ?? b.id ?? 0;
      return idB - idA;
    })
    .slice(0, 5);

  const handleNavegarDetalle = (item: ItemBandeja) => {
    const realId = item.id_observacion ?? item.id_ticket ?? item.id;

    if (isSupervisor) {
      // Redirige a la gestión de subsanaciones del supervisor
      navigate(`/subsanacion/${realId}`);
    } else {
      // Redirige al usuario municipal para aprobar y generar el Ticket Oficial
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

      {/* Tarjetas KPI */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiTotal}`}>
          <h3>Total de Registros</h3>
          <p className={styles.kpiNumber}>{totalRegistros}</p>
          <span className={styles.kpiSubtitle}>
            {isSupervisor ? 'Subsanaciones asignadas' : 'Observaciones ingresadas'}
          </span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiPending}`}>
          <h3>Pendientes</h3>
          <p className={styles.kpiNumber}>{pendientesCount}</p>
          <span className={styles.kpiSubtitle}>Requieren atención</span>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCompleted}`}>
          <h3>Atendidas / Resueltas</h3>
          <p className={styles.kpiNumber}>{atendidasCount}</p>
          <span className={styles.kpiSubtitle}>Procesadas con éxito</span>
        </div>
      </div>

      {/* Sección del listado dinámico */}
      <div className={styles.recentSection}>
        <h2>{isSupervisor ? 'Últimas 5 Subsanaciones Pendientes' : 'Últimas 5 Observaciones Pendientes de Conversión'}</h2>
        {ultimasPendientes.length === 0 ? (
          <p className={styles.emptyText}>No hay registros pendientes en este momento.</p>
        ) : (
          <ul className={styles.recentList}>
            {ultimasPendientes.map((item, index) => {
              const itemId = item.id_observacion ?? item.id_ticket ?? item.id ?? (index + 1);
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
                    <span className={styles.badge}>{item.estado || 'Pendiente'}</span>
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
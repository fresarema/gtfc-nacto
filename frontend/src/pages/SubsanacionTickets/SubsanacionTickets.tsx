import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupervisorTickets } from '../../services/api';
import styles from './SubsanacionTickets.module.css';

interface Ticket {
  id: number;
  id_ticket?: number;
  titulo?: string;
  nombre?: string;
  name?: string;
  title?: string;
  asunto?: string;
  ticket_name?: string;
  descripcion: string;
  descripcion_ticket?: string;
  ubicacion?: string;
  estado?: string;
  fecha?: string;
  fecha_registro?: string;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

function parsearDescripcion(desc: string): { tag: string | null; cleanDesc: string } {
  if (!desc) return { tag: null, cleanDesc: "" };
  
  const regex = /^\[(.*?)\]\s*(.*)$/;
  const coincidencia = desc.match(regex);
  
  if (coincidencia) {
    return {
      tag: coincidencia[1].trim(),
      cleanDesc: coincidencia[2].trim()
    };
  }
  
  return { tag: null, cleanDesc: desc };
}

export const SubsanacionTickets: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const resPerfil = await fetch(`${API_BASE_URL}/api/auth/profile/`, { headers });
        if (resPerfil.ok) {
          const perfil = await resPerfil.json();
          setUserRole(perfil.rol || '');
        }

        const data = await getSupervisorTickets();
        setTickets(data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const esMunicipal = ['usuario municipal', 'municipal', 'administrador', 'admin'].includes(userRole.toLowerCase());

  // Lógica de filtrado combinada (Exclusión de cerrados + Estado + Texto)
  const ticketsFiltrados = tickets.filter((item) => {
    const estadoItem = (item.estado || 'Abierto').toLowerCase();
    
    // Ocultar automáticamente los tickets cerrados o resueltos de esta bandeja activa
    if (['cerrado', 'resuelto'].includes(estadoItem)) {
      return false;
    }

    // Filtro por Estado Seleccionado
    if (estadoFiltro !== 'todos' && estadoItem !== estadoFiltro) {
      return false;
    }

    // Filtro por Búsqueda de Texto
    if (busquedaTexto.trim() !== '') {
      const query = busquedaTexto.toLowerCase();
      const realId = String(item.id || item.id_ticket || '');
      const descReal = (item.descripcion_ticket || item.descripcion || '').toLowerCase();
      const titulo = (item.titulo || item.nombre || '').toLowerCase();

      return realId.includes(query) || descReal.includes(query) || titulo.includes(query);
    }

    return true;
  });

  if (loading) return <div className={styles.container}>Cargando bandeja de subsanación...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {esMunicipal ? 'Auditoría de Subsanaciones' : 'Bandeja de Subsanación (Empresas)'}
      </h2>
      <p className={styles.subtitle}>
        {esMunicipal 
          ? 'Revisión y validación municipal de evidencias enviadas por los supervisores' 
          : 'Tickets oficiales aprobados pendientes de resolución y carga de evidencia'}
      </p>

      {/* SECCIÓN DE FILTROS */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtrar por Estado:</label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos los Estados</option>
            <option value="abierto">Abierto</option>
            <option value="rechazado">Rechazado</option>
            <option value="en revisión">En Revisión</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1, maxWidth: '400px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Buscar Ticket:</label>
          <input
            type="text"
            placeholder="Buscar por N° registro, título o descripción..."
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ alignSelf: 'flex-end', paddingBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          Mostrando: <strong>{ticketsFiltrados.length}</strong> de {tickets.filter(t => !['cerrado', 'resuelto'].includes((t.estado || '').toLowerCase())).length} tickets activos
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>N° Registro</th>
              <th>Título / Descripción</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className={styles.thActions}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ticketsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No se encontraron tickets con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              ticketsFiltrados.map((item, index) => {
                const realId = item.id || item.id_ticket || (index + 1);
                
                const tituloExplicito = item.titulo || item.nombre || item.title || item.name || item.asunto || item.ticket_name;
                const descReal = item.descripcion_ticket || item.descripcion;
                const { tag, cleanDesc } = parsearDescripcion(descReal);
                
                let tituloFinal: string;
                if (tituloExplicito && tituloExplicito.trim() !== "") {
                  tituloFinal = tituloExplicito.trim();
                } else if (tag) {
                  tituloFinal = tag;
                } else {
                  tituloFinal = `Ticket Oficial #${realId}`;
                }

                const fechaTexto = item.fecha_registro || item.fecha || 'Sin fecha';
                const estadoLower = (item.estado || 'Validado').toLowerCase();

                let textoBoton = 'Ver Detalle';
                if (esMunicipal) {
                  textoBoton = estadoLower === 'en revisión' ? 'Revisar Subsanación' : 'Ver Detalle';
                } else {
                  textoBoton = estadoLower === 'en revisión' ? 'Ver Evidencia Enviada' : 'Subir Evidencia';
                }

                return (
                  <tr key={realId}>
                    <td className={styles.tdId}>#{realId}</td>
                    <td>
                      <div className={styles.cellContent}>
                        <strong>{tituloFinal}</strong>
                        <span className={styles.cellDesc}>{cleanDesc || item.ubicacion || "(Sin detalles adicionales)"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[estadoLower] || ''}`}>
                        {item.estado || 'Validado'}
                      </span>
                    </td>
                    <td className={styles.tdDate}>{fechaTexto}</td>
                    <td className={styles.tdActions}>
                      <button 
                        className={styles.detailButton}
                        onClick={() => navigate(esMunicipal ? `/detalle-ticket/${realId}` : `/subsanacion/${realId}`)}
                        style={esMunicipal ? { background: '#2563eb' } : undefined}
                      >
                        {textoBoton}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubsanacionTickets;
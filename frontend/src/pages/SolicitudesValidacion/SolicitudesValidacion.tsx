import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SolicitudesValidacion.module.css';

interface ObservacionItem {
  id_observacion?: number;
  id_ticket?: number;
  id?: number;
  titulo?: string;
  nombre?: string;
  name?: string;
  title?: string;
  asunto?: string;
  ticket_name?: string;
  descripcion: string;
  estado?: string;
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

export const SolicitudesValidacion: React.FC = () => {
  const [observaciones, setObservaciones] = useState<ObservacionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificación estricta del rol: si es supervisor, bloquear y redirigir
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role === 'supervisor' || role === 'empresa') {
      navigate('/subsanacion', { replace: true });
      return;
    }

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    fetch(`${API_BASE_URL}/api/observaciones/`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then((data: ObservacionItem[]) => {
        setObservaciones(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div className={styles.container}>Cargando solicitudes...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Solicitudes de Validación</h2>
      
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
            {observaciones.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>No hay solicitudes registradas.</td>
              </tr>
            ) : (
              observaciones.map((item) => {
                const realId = item.id_observacion ?? item.id_ticket ?? item.id;
                
                const tituloExplicito = item.titulo || item.nombre || item.title || item.name || item.asunto || item.ticket_name;
                const { tag, cleanDesc } = parsearDescripcion(item.descripcion);
                
                let tituloFinal: string;
                if (tituloExplicito && tituloExplicito.trim() !== "") {
                  tituloFinal = tituloExplicito.trim();
                } else if (tag) {
                  tituloFinal = tag;
                } else {
                  tituloFinal = `Ticket Oficial #${realId}`;
                }

                const fechaTexto = item.fecha_registro || 'Sin fecha';

                return (
                  <tr key={realId}>
                    <td className={styles.tdId}>#{realId}</td>
                    <td>
                      <div className={styles.cellContent}>
                        <strong>{tituloFinal}</strong>
                        <span className={styles.cellDesc}>{cleanDesc || "(Sin detalles adicionales)"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.badge}>{item.estado || 'Pendiente'}</span>
                    </td>
                    <td className={styles.tdDate}>{fechaTexto}</td>
                    <td className={styles.tdActions}>
                      <button 
                        className={styles.detailButton}
                        onClick={() => navigate(`/solicitudes-validacion/${realId}`)}
                      >
                        Ver Detalle
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

export default SolicitudesValidacion;
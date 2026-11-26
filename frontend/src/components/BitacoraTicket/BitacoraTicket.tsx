import React, { useMemo, useState } from 'react';
import './BitacoraTicket.css';

export interface EventoBitacora {
  id_historial: number;
  fecha: string | null;
  hora: string | null;
  fecha_hora: string | null;
  tipo_accion: string;
  comentarios: string;
  usuario_rol: string;
  usuario_nombre?: string;
}

interface BitacoraTicketProps {
  eventos: EventoBitacora[];
  orden: 'asc' | 'desc';
  onCambiarOrden: (nuevoOrden: 'asc' | 'desc') => void;
  cargando?: boolean;
}

export default function BitacoraTicket({
  eventos,
  orden,
  onCambiarOrden,
  cargando = false,
}: BitacoraTicketProps) {
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const tiposAccion = useMemo(() => {
    const setTipos = new Set<string>();
    eventos.forEach((ev) => {
      if (ev.tipo_accion) setTipos.add(ev.tipo_accion);
    });
    return Array.from(setTipos);
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    if (filtroTipo === 'todos') return eventos;
    return eventos.filter((ev) => ev.tipo_accion === filtroTipo);
  }, [eventos, filtroTipo]);

  return (
    <section className="bitacora-section" aria-label="Bitácora histórica del ticket">
      <div className="bitacora-toolbar">
        <div className="bitacora-filter-group">
          <label htmlFor="filtro-tipo-accion" className="bitacora-filter-label">
            Tipo de acción
          </label>
          <select
            id="filtro-tipo-accion"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bitacora-select"
            disabled={cargando}
          >
            <option value="todos">Todas ({eventos.length})</option>
            {tiposAccion.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onCambiarOrden(orden === 'asc' ? 'desc' : 'asc')}
          className="bitacora-sort-btn"
          disabled={cargando}
        >
          Orden: {orden === 'asc' ? 'Más antiguos primero ▲' : 'Más recientes primero ▼'}
        </button>
      </div>

      {cargando ? (
        <div className="bitacora-empty">Cargando registros de bitácora...</div>
      ) : eventosFiltrados.length === 0 ? (
        <div className="bitacora-empty">
          No hay eventos registrados para el filtro seleccionado.
        </div>
      ) : (
        <ol className="bitacora-timeline">
          {eventosFiltrados.map((evento) => (
            <li key={evento.id_historial} className="bitacora-item">
              <div className="bitacora-marker" aria-hidden="true" />

              <div className="bitacora-card">
                <div className="bitacora-card-header">
                  <span className="bitacora-accion-badge">{evento.tipo_accion}</span>
                  <span className="bitacora-fecha">
                    {evento.fecha_hora ||
                      [evento.fecha, evento.hora].filter(Boolean).join(' ') ||
                      'Sin fecha'}
                  </span>
                </div>

                <p className="bitacora-comentario">{evento.comentarios}</p>

                <div className="bitacora-meta">
                  <span>
                    <strong>Responsable:</strong> {evento.usuario_nombre || 'Sistema'}
                  </span>
                  <span className="bitacora-rol">{evento.usuario_rol}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
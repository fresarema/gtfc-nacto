import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './FiscalizadorObservacionesPage.css';

interface EmpresaInfo {
  id_empresa?: number;
  razon_social?: string;
  nombre?: string;
}

interface Observacion {
  id: number;
  id_observacion: number;
  id_empresa?: number | null;
  descripcion: string;
  empresa_nombre?: string | null;
  razon_social?: string | null;
  nombre_empresa?: string | null;
  empresa?: EmpresaInfo | string | null;
  fecha_registro: string;
  hora_registro: string;
  estado: string;
  ubicacion_observacion: any;
  fotografias: string[];
}

export default function FiscalizadorObservacionesPage() {
  const navigate = useNavigate();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [mapaEmpresas, setMapaEmpresas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados para los filtros superiores
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  const [observacionSeleccionada, setObservacionSeleccionada] = useState<Observacion | null>(null);

  useEffect(() => {
    fetchMisObservaciones();
  }, []);

  const fetchMisObservaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [resObs, resEmpresas] = await Promise.all([
        api.get('/fiscalizador/observaciones/', { headers }),
        api.get('/empresas/', { headers }).catch(() => ({ data: [] })),
      ]);

      const diccionarioEmpresas: Record<number, string> = {};
      (resEmpresas.data || []).forEach((emp: EmpresaInfo) => {
        const nombreEmp = emp.razon_social || emp.nombre;
        if (emp.id_empresa && nombreEmp) {
          diccionarioEmpresas[emp.id_empresa] = nombreEmp;
        }
      });

      setMapaEmpresas(diccionarioEmpresas);
      setObservaciones(resObs.data || []);
    } catch (err: any) {
      console.error('Error detallado al cargar observaciones:', err.response || err);
      setError('No se pudieron cargar tus observaciones.');
    } finally {
      setLoading(false);
    }
  };

  // Obtiene la razón social o nombre de la empresa asociada a la observación
  const obtenerNombreEmpresa = (obs: Observacion) => {
    if (obs.empresa_nombre && obs.empresa_nombre.trim()) return obs.empresa_nombre.trim();
    if (obs.razon_social && obs.razon_social.trim()) return obs.razon_social.trim();
    if (obs.nombre_empresa && obs.nombre_empresa.trim()) return obs.nombre_empresa.trim();

    if (typeof obs.empresa === 'string' && obs.empresa.trim()) {
      return obs.empresa.trim();
    }

    if (obs.empresa && typeof obs.empresa === 'object') {
      const nombreObj = obs.empresa.razon_social || obs.empresa.nombre;
      if (nombreObj && nombreObj.trim()) return nombreObj.trim();
    }

    const idEmp =
      obs.id_empresa ??
      (obs.empresa && typeof obs.empresa === 'object' ? obs.empresa.id_empresa : undefined);

    if (idEmp && mapaEmpresas[idEmp]) {
      return mapaEmpresas[idEmp];
    }

    return 'Empresa no especificada';
  };

  // Limita latitud y longitud a parte entera y 4 decimales
  const formatearCoordenada4 = (valor: any) => {
    if (valor === null || valor === undefined || valor === '') return 'N/A';
    const numero = Number(valor);
    return Number.isNaN(numero) ? String(valor) : numero.toFixed(4);
  };

  const formatearUbicacion = (ubicacion: any) => {
    if (!ubicacion) return 'Sin ubicación registrada';
    if (typeof ubicacion === 'object') {
      const latFormateada = formatearCoordenada4(ubicacion.latitud);
      const lngFormateada = formatearCoordenada4(ubicacion.longitud);
      return `Lat: ${latFormateada}, Lng: ${lngFormateada}`;
    }
    return String(ubicacion);
  };

  // Filtrado dinámico por nombre/razón social de empresa y fecha
  const observacionesFiltradas = observaciones.filter((obs) => {
    const textoBusqueda = filtroEmpresa.toLowerCase().trim();
    const nombreEmpresa = obtenerNombreEmpresa(obs).toLowerCase();

    const coincideEmpresa =
      !textoBusqueda ||
      nombreEmpresa.includes(textoBusqueda) ||
      (obs.descripcion && obs.descripcion.toLowerCase().includes(textoBusqueda)) ||
      String(obs.id_observacion || obs.id).includes(textoBusqueda);

    const coincideFecha =
      !filtroFecha ||
      (obs.fecha_registro && obs.fecha_registro.includes(filtroFecha));

    return coincideEmpresa && coincideFecha;
  });

  const limpiarFiltros = () => {
    setFiltroEmpresa('');
    setFiltroFecha('');
  };

  return (
    <div className="fiscalizador-obs-layout">
      <div className="fiscalizador-obs-container">

        <header className="fiscalizador-obs-header">
          <div>
            <h1 className="fiscalizador-obs-title">Mis Observaciones</h1>
            <p className="fiscalizador-obs-subtitle">Historial de registros realizados en terreno</p>
          </div>
        </header>

        {/* BARRA DE FILTROS SUPERIOR */}
        <section className="fiscalizador-filter-bar">
          <div className="filter-input-group">
            <label htmlFor="filtro-empresa">Buscar por empresa o detalle</label>
            <input
              id="filtro-empresa"
              type="text"
              placeholder="Ej. razón social, descripción, #ID..."
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="filter-control"
            />
          </div>

          <div className="filter-input-group">
            <label htmlFor="filtro-fecha">Filtrar por fecha</label>
            <input
              id="filtro-fecha"
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="filter-control"
            />
          </div>

          {(filtroEmpresa || filtroFecha) && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="btn-limpiar-filtros"
            >
              Limpiar
            </button>
          )}
        </section>

        {error && <div className="fiscalizador-error-banner">{error}</div>}

        {loading ? (
          <div className="fiscalizador-loading-state">Cargando registros...</div>
        ) : (
          <div className="fiscalizador-obs-content">
            {observacionesFiltradas.length > 0 ? (
              <div className="fiscalizador-grid-cards">
                {observacionesFiltradas.map((obs) => (
                  <div
                    key={obs.id_observacion || obs.id}
                    className="obs-card-item"
                    onClick={() => setObservacionSeleccionada(obs)}
                    title="Haz clic para ver el detalle"
                  >
                    <div className="obs-card-top">
                      <div className="obs-card-top-left">
                        <span className="obs-id">#{obs.id_observacion || obs.id}</span>
                        <span className="obs-empresa-badge">{obtenerNombreEmpresa(obs)}</span>
                      </div>
                      <span className="obs-fecha">
                        {obs.fecha_registro} {obs.hora_registro ? `- ${obs.hora_registro}` : ''}
                      </span>
                    </div>

                    <p className="obs-descripcion">
                      <strong>Descripción:</strong> {obs.descripcion.length > 90 ? obs.descripcion.substring(0, 90) + '...' : obs.descripcion}
                    </p>

                    <div className="obs-card-footer">
                      <p className="obs-ubicacion">
                        <em>{formatearUbicacion(obs.ubicacion_observacion)}</em>
                      </p>
                      <span className="obs-ver-detalle">
                        Ver detalle →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-empty-obs">
                {observaciones.length > 0
                  ? 'No se encontraron observaciones con los filtros aplicados.'
                  : 'No tienes observaciones registradas en este momento.'}
              </div>
            )}
          </div>
        )}

        {/* BOTÓN DE RETORNO ACCESIBLE EN LA PARTE INFERIOR */}
        <div className="fiscalizador-bottom-actions">
          <button
            onClick={() => navigate('/fiscalizador')}
            className="btn-volver-inferior"
          >
            ← Volver al Menú Principal
          </button>
        </div>
      </div>

      {/* MODAL DE DETALLE DE LA OBSERVACIÓN */}
      {observacionSeleccionada && (
        <div className="obs-modal-backdrop" onClick={() => setObservacionSeleccionada(null)}>
          <div className="obs-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="obs-modal-header">
              <h3>Detalle de Observación #{observacionSeleccionada.id_observacion}</h3>
              <button
                onClick={() => setObservacionSeleccionada(null)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="obs-preview-content">
              <div className="obs-preview-item">
                <strong>Empresa / Razón Social:</strong>
                <p className="obs-preview-text">{obtenerNombreEmpresa(observacionSeleccionada)}</p>
              </div>

              <div className="obs-preview-item">
                <strong>Estado Actual:</strong>{' '}
                <span className="obs-badge-estado">
                  {observacionSeleccionada.estado || 'Pendiente'}
                </span>
              </div>

              <div className="obs-preview-item">
                <strong>Fecha y Hora de Registro:</strong>
                <p className="obs-preview-text">
                  {observacionSeleccionada.fecha_registro} {observacionSeleccionada.hora_registro ? `a las ${observacionSeleccionada.hora_registro}` : ''}
                </p>
              </div>

              <div className="obs-preview-item">
                <strong>Ubicación GPS:</strong>
                <p className="obs-preview-text">
                  {formatearUbicacion(observacionSeleccionada.ubicacion_observacion)}
                </p>
              </div>

              <div className="obs-preview-item">
                <strong>Descripción Completa:</strong>
                <p className="obs-preview-desc">
                  {observacionSeleccionada.descripcion}
                </p>
              </div>

              {observacionSeleccionada.fotografias && observacionSeleccionada.fotografias.length > 0 && (
                <div className="obs-preview-item">
                  <strong>Evidencia Fotográfica:</strong>
                  <div className="obs-fotos-lista">
                    {observacionSeleccionada.fotografias.map((fotoUrl, idx) => (
                      <div key={idx} className="obs-foto-box">
                        <a href={`http://localhost:8000${fotoUrl}`} target="_blank" rel="noopener noreferrer" className="obs-foto-link">
                          Ver imagen en tamaño completo ↗
                        </a>
                        <img
                          src={`http://localhost:8000${fotoUrl}`}
                          alt={`Evidencia ${idx + 1}`}
                          className="obs-foto-img"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="obs-modal-footer">
              <button
                type="button"
                onClick={() => setObservacionSeleccionada(null)}
                className="btn-cerrar-detalle"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
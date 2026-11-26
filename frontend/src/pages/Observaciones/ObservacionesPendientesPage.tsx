import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './ObservacionesPendientesPage.css';
import fondo from '../../assets/whiteBG.png';

interface Observacion {
  id: number;
  id_observacion: number;
  fecha_registro: string;
  hora_registro: string;
  descripcion: string;
  ubicacion_observacion: any;
  estado: string;
  fotografias: string[];
}

export default function ObservacionesPendientesPage() {
  const navigate = useNavigate();
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observacion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Estados para controlar el modal de previsualización, carga y éxito
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [prioridadTicket] = useState<string>('Alta');
  const [diasPlazoTicket] = useState<string>('5');
  
  const [submittingTicket, setSubmittingTicket] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';
  const esMunicipalOrAdmin = ['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol);

  useEffect(() => {
    if (!esMunicipalOrAdmin) {
      alert('Acceso denegado. Esta sección es exclusiva para personal municipal y administradores.');
      navigate('/dashboard');
      return;
    }
    fetchObservaciones();
  }, [esMunicipalOrAdmin, navigate]);

  const fetchObservaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/observaciones/');
      setObservaciones(response.data);
    } catch (err: any) {
      console.error('Error al cargar observaciones:', err);
      setError('No se pudieron cargar las observaciones pendientes.');
    } finally {
      setLoading(false);
    }
  };

  const formatearUbicacion = (ubicacion: any) => {
    if (!ubicacion) return 'N/A';
    if (typeof ubicacion === 'string') return ubicacion;
    if (typeof ubicacion === 'object') {
      if (ubicacion.direccion) return ubicacion.direccion;
      if (ubicacion.latitud && ubicacion.longitud) {
        return `Lat: ${ubicacion.latitud}, Long: ${ubicacion.longitud}`;
      }
      return JSON.stringify(ubicacion);
    }
    return String(ubicacion);
  };

  const handleOpenPreview = () => {
    if (selectedObs) {
      setShowPreview(true);
    }
  };

  const handleConfirmSubmitTicket = async () => {
    if (!selectedObs) return;

    try {
      setShowPreview(false);
      setSubmittingTicket(true);
      setError('');

      await new Promise((r) => setTimeout(r, 50));

      const payload = {
        id_observacion: selectedObs.id_observacion,
        prioridad: prioridadTicket,
        dias_plazo: Number(diasPlazoTicket),
        descripcion_ticket: selectedObs.descripcion
      };

      await Promise.all([
        api.post('/tickets/convertir/', payload),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);

      setSubmittingTicket(false);
      setSuccessMessage(true);

      setTimeout(() => {
        setSuccessMessage(false);
        setSelectedObs(null);
        fetchObservaciones();
      }, 1500);

    } catch (err: any) {
      console.error('Error al convertir observación:', err);
      setSubmittingTicket(false);
      setError(err.response?.data?.error || 'Ocurrió un error al convertir la observación en ticket.');
    }
  };

  if (!esMunicipalOrAdmin) return null;

  return (
    <div className="dashboard-app-layout"
    style={{ backgroundImage: `url(${fondo})` }}>
      
      <Navbar />

      <main className="dashboard-main-content">
        <header className="main-header">
          <div>
            <h1 className="main-title">Bandeja de Validación de Terreno</h1>
            <p className="main-subtitle">Gestión y conversión formal de registros enviados por los fiscalizadores</p>
          </div>
          {selectedObs && (
            <button onClick={() => { setSelectedObs(null); setShowPreview(false); }} className="btn-volver-obs">
              ← Volver al Listado
            </button>
          )}
        </header>

        {error && <div className="dashboard-error-banner">{error}</div>}

        {loading ? (
          <div className="dashboard-loading-state">Cargando observaciones pendientes...</div>
        ) : selectedObs ? (
          /* VISTA DE DETALLE MODERNA */
          <div className="obs-detail-container-card">
            <div className="obs-detail-topbar">
              <div>
                <span className="obs-badge-id">Observación #{selectedObs.id_observacion}</span>
                <h2 className="obs-detail-heading">Revisión de Registro de Terreno</h2>
              </div>
              <span className={`badge-estado ${selectedObs.estado?.toLowerCase().replace(/\s+/g, '_')}`}>
                {selectedObs.estado}
              </span>
            </div>

            <div className="obs-info-grid">
              <div className="obs-info-box">
                <span className="obs-info-label">Fecha y Hora de Registro</span>
                <span className="obs-info-value">{selectedObs.fecha_registro} / {selectedObs.hora_registro}</span>
              </div>
              <div className="obs-info-box">
                <span className="obs-info-label">Coordenadas / Ubicación GPS</span>
                <span className="obs-info-value font-mono">{formatearUbicacion(selectedObs.ubicacion_observacion)}</span>
              </div>
            </div>

            <div className="obs-info-grid" style={{ marginTop: '1rem' }}>
              <div className="obs-info-box">
                <span className="obs-info-label">Prioridad Asignada</span>
                <span className="obs-info-value ">{prioridadTicket}</span>
              </div>
              <div className="obs-info-box">
                <span className="obs-info-label">Plazo Estimado</span>
                <span className="obs-info-value">{diasPlazoTicket} días hábiles</span>
              </div>
            </div>

            <div className="obs-description-section">
              <span className="obs-info-label">Descripción Detallada de la Observación</span>
              <div className="obs-desc-text-box">
                {selectedObs.descripcion}
              </div>
            </div>

            <div className="obs-description-section">
              <span className="obs-info-label">Evidencia Fotográfica Adjunta</span>
              {selectedObs.fotografias && selectedObs.fotografias.length > 0 ? (
                <div className="obs-photo-preview-wrapper">
                  <div className="obs-img-frame">
                    <img 
                      src={`http://localhost:8000${selectedObs.fotografias[0]}`} 
                      alt="Evidencia" 
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <a 
                    href={`http://localhost:8000${selectedObs.fotografias[0]}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="obs-external-link"
                  >
                    Abrir imagen en alta resolución (pestaña nueva)
                  </a>
                </div>
              ) : (
                <p className="text-muted">No se adjuntó fotografía en este registro.</p>
              )}
            </div>

            <div className="obs-footer-actions">
              <button onClick={() => setSelectedObs(null)} className="btn-cancelar-obs">
                Cancelar
              </button>
              <button onClick={handleOpenPreview} className="btn-submit-obs">
                Revisar y Enviar a Ticket
              </button>
            </div>
          </div>
        ) : (
          /* TABLA MODAL ESTILIZADA */
          <div className="table-card-container">
            <div className="table-header-title">
              <h3>Registros Pendientes de Validación</h3>
            </div>
            <table className="dashboard-data-table">
              <thead>
                <tr>
                  <th>ID OBS</th>
                  <th>FECHA / HORA</th>
                  <th>UBICACIÓN GPS</th>
                  <th>DESCRIPCIÓN</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {observaciones.length > 0 ? (
                  observaciones.map((obs) => (
                    <tr key={obs.id_observacion}>
                      <td className="font-mono">#{obs.id_observacion}</td>
                      <td>{obs.fecha_registro} {obs.hora_registro}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {formatearUbicacion(obs.ubicacion_observacion)}
                      </td>
                      <td className="obs-desc-cell">{obs.descripcion}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedObs(obs)}
                          className="btn-table-action"
                        >
                          Ver Detalle →
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-empty-table">
                      No hay observaciones pendientes de validación en este momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* MODAL DE PREVISUALIZACIÓN */}
      {showPreview && selectedObs && (
        <div className="obs-modal-backdrop">
          <div className="obs-modal-card">
            <h3>🔍 Previsualización de Conversión a Ticket</h3>
            <p className="obs-modal-subtitle">
              Verifique la información antes de registrar formalmente el ticket en el sistema municipal.
            </p>

            <div className="obs-preview-content">
              <div className="obs-preview-item highlight">
                <strong>Observación de Origen:</strong> <span className="text-empresa">#{selectedObs.id_observacion}</span>
              </div>

              <div className="form-row">
                <div className="obs-preview-item">
                  <strong>Prioridad:</strong> {prioridadTicket}
                </div>
                <div className="obs-preview-item">
                  <strong>Plazo:</strong> {diasPlazoTicket} días hábiles
                </div>
              </div>

              <div className="obs-preview-item">
                <strong>Descripción del Ticket:</strong>
                <p className="obs-preview-desc">{selectedObs.descripcion}</p>
              </div>

              <div className="obs-preview-item">
                <strong>Ubicación GPS:</strong> {formatearUbicacion(selectedObs.ubicacion_observacion)}
              </div>

              {selectedObs.fotografias && selectedObs.fotografias.length > 0 && (
                <div className="obs-preview-item">
                  <strong>Fotografía de Evidencia:</strong>
                  <div className="obs-preview-img-container">
                    <img 
                      src={`http://localhost:8000${selectedObs.fotografias[0]}`} 
                      alt="Evidencia" 
                      className="obs-preview-img" 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="obs-modal-actions">
              <button 
                type="button" 
                onClick={() => setShowPreview(false)}
                disabled={submittingTicket}
                className="btn-modal-back"
              >
                Volver
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmitTicket}
                disabled={submittingTicket}
                className="btn-modal-confirm"
              >
                Confirmar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY DE CARGA */}
      {submittingTicket && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card">
            <div className="spinner-loader"></div>
            <h3>Conviriendo a Ticket...</h3>
            <p>Generando el ticket formal en el sistema y actualizando registros...</p>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {successMessage && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card success-card">
            <div className="success-icon-badge">✓</div>
            <h3>¡Conversión Exitosa!</h3>
            <p>La observación se ha convertido a ticket formal correctamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import SupervisorSubsideForm from '../../components/FormularioSubsanación/SupervisorSubsideForm';
import './TicketDetailPage.css';
import fondo from '../../assets/whiteBG.png';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditDecision, setAuditDecision] = useState<string>('Cerrado');
  const [auditComentario, setAuditComentario] = useState<string>('');

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  const esMunicipalOrAdmin = ['administrador', 'admin', 'usuario municipal', 'municipal'].includes(rol);
  const esSupervisor = ['supervisor de empresa externa', 'supervisor'].includes(rol);

  useEffect(() => {
    fetchTicketDetail();
  }, [id]);

  const fetchTicketDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tickets/${id}/`);
      setTicket(response.data);
    } catch (err: any) {
      console.error('Error al obtener detalle del ticket:', err);
      setError('No se pudo cargar la información del ticket.');
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

  const handleOpenAuditModal = (decision: string) => {
    setAuditDecision(decision);
    setAuditComentario('');
    setShowAuditModal(true);
  };

  const handleConfirmAuditoria = async () => {
    if (!auditComentario.trim()) {
      alert('Debe ingresar un comentario u observación para la auditoría.');
      return;
    }

    try {
      await api.post(`/tickets/auditar/${id}/`, {
        estado: auditDecision,
        comentario: auditComentario
      });
      alert(`Ticket actualizado a ${auditDecision} exitosamente.`);
      setShowAuditModal(false);
      fetchTicketDetail();
    } catch (err: any) {
      console.error('Error al auditar ticket:', err);
      alert('Error al procesar la auditoría.');
    }
  };

  if (loading) return <div className="dashboard-loading-state">Cargando detalle del ticket...</div>;
  if (error || !ticket) return <div className="dashboard-error-banner">{error || 'Ticket no encontrado.'}</div>;

  const estadoTicket = ticket.estado?.toLowerCase() || '';
  const estaEnRevision = estadoTicket === 'en revisión' || estadoTicket === 'en_revision';
  const esCerrado = estadoTicket === 'cerrado';
  const API_BASE_URL = 'http://localhost:8000';

  return (
    <div 
      className="dashboard-app-layout"
      style={{ 
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.94), rgba(248, 250, 252, 0.94)), url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="ticket-detail-card">
          <header className="ticket-header">
            <div>
              <span className="ticket-code">#{ticket.cod_consulta_externa || ticket.id_ticket}</span>
              <h2 className="ticket-title">Fiscalización de Contratos</h2>
              <p className="ticket-subtitle">Área: {ticket.area_asignada || 'General'} | Empresa Asignada</p>
            </div>
            <span className={`badge-estado ${estadoTicket.replace(/\s+/g, '_')}`}>
              {ticket.estado}
            </span>
          </header>

          <div className="ticket-meta-grid">
            <div className="ticket-meta-item">
              <strong>Prioridad</strong>
              <span>{ticket.prioridad}</span>
            </div>
            <div className="ticket-meta-item">
              <strong>Vencimiento</strong>
              <span>{ticket.fecha_vencimiento || 'N/A'}</span>
            </div>
            <div className="ticket-meta-item">
              <strong>Ubicación</strong>
              <span>{formatearUbicacion(ticket.ubicacion_observacion)}</span>
            </div>
          </div>

          <div className="ticket-section">
            <h3>Datos Asociados al Registro</h3>
            <div className="ticket-meta-grid" style={{ marginBottom: 0 }}>
              <div className="ticket-meta-item">
                <strong>ID Observación Origen</strong>
                <span className="font-mono">#{ticket.id_observacion || 'N/A'}</span>
              </div>
              <div className="ticket-meta-item">
                <strong>Fecha de Creación</strong>
                <span>{ticket.fecha_registro || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="ticket-section" style={{ marginTop: '1.5rem' }}>
            <h3>Descripción Inicial de la Observación</h3>
            <p className="ticket-description-box">
              {ticket.descripcion}
            </p>
          </div>

          <div className="ticket-section" style={{ marginTop: '1.5rem' }}>
            <h3>Evidencia Fotográfica</h3>
            {ticket.fotografias && ticket.fotografias.length > 0 ? (
              <div className="ticket-photo-container">
                <div className="ticket-img-wrapper">
                  <img 
                    src={`${API_BASE_URL}${ticket.fotografias[0]}`} 
                    alt="Evidencia fotográfica" 
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <a 
                  href={`${API_BASE_URL}${ticket.fotografias[0]}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ticket-photo-link"
                >
                 Abrir imagen en alta resolución (pestaña nueva)
                </a>
              </div>
            ) : (
              <p className="text-muted">No hay fotografías adjuntas para este ticket.</p>
            )}
          </div>

          {/* VISTA MUNICIPAL / ADMIN: ACCIONES DE AUDITORÍA */}
          {esMunicipalOrAdmin && (
            <div className="municipal-actions-section">
              <h3>Acciones de Auditoría Municipal</h3>

              {estaEnRevision ? (
                <div className="action-buttons-group">
                  <button 
                    type="button"
                    onClick={() => handleOpenAuditModal('Cerrado')} 
                    className="ticket-btn-action btn-conformidad"
                  >
                    ✓ Dar Conformidad (Cerrar)
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleOpenAuditModal('Rechazado')} 
                    className="ticket-btn-action btn-solicitar-subsanacion"
                  >
                    ↻ Solicitar Nueva Subsanación
                  </button>
                </div>
              ) : (
                <div className="ticket-waiting-banner">
                  <span>A la espera de respuesta de subsanación por parte de la empresa externa.</span>
                </div>
              )}
            </div>
          )}

          {/* VISTA SUPERVISOR EXTERNO: RESTRICCIÓN DE ESTADO (CERRADO O EN REVISIÓN) */}
          {esSupervisor && (
            <>
              {esCerrado || estaEnRevision ? (
                <div className="ticket-section" style={{ marginTop: '1.5rem' }}>
                  <div style={{ 
                    padding: '1.25rem 1.5rem', 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderLeft: '4px solid #535353',
                    borderRadius: '0.5rem', 
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem'
                  }}>
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                      <strong>Acción restringida:</strong> Este ticket se encuentra en estado <strong style={{ color: '#000000' }}>{ticket.estado}</strong>. No es posible adjuntar nueva evidencia ni realizar modificaciones en este momento.
                    </div>
                  </div>
                </div>
              ) : (
                <SupervisorSubsideForm 
                  ticketId={id!}
                  onSuccess={() => navigate('/dashboard')}
                  onCancel={() => navigate('/dashboard')}
                  apiService={api}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL DE AUDITORÍA MUNICIPAL */}
      {showAuditModal && (
        <div className="ticket-modal-backdrop">
          <div className="ticket-modal-card">
            <h3>Auditoría de Ticket: <span className="text-highlight">{auditDecision}</span></h3>
            <p className="ticket-modal-subtitle">
              Ingrese el motivo o comentario formal que quedará registrado en el historial del ticket.
            </p>

            <div className="ticket-modal-content">
              <div className="ticket-form-group">
                <label>
                  Comentario u Observación <span className="required-star">*</span>
                </label>
                <textarea 
                  rows={4}
                  value={auditComentario}
                  onChange={(e) => setAuditComentario(e.target.value)}
                  placeholder="Describa el motivo de la decisión..."
                  required
                />
              </div>
            </div>

            <div className="ticket-modal-actions">
              <button 
                type="button" 
                onClick={() => setShowAuditModal(false)}
                className="ticket-btn-modal-back"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmAuditoria}
                className="ticket-btn-modal-confirm"
              >
                Confirmar Decisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
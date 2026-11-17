import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useGeolocation } from '../../Hooks/useGeolocation';
import { useObservationForm } from '../../Hooks/useObservationForm';
import './CreateObservationPage.css';
import fondo from '../../assets/whiteBG.png';

export default function CreateObservationPage() {
  const navigate = useNavigate();
  
  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';

  const handleVolver = () => {
    if (rol.includes('fiscalizador')) {
      navigate('/fiscalizadorHome');
    } else {
      navigate('/dashboard');
    }
  };

  // Usamos nuestros Custom Hooks
  const { latitud, longitud, geoStatus } = useGeolocation();
  const {
    empresas,
    idEmpresa,
    setIdEmpresa,
    prioridad,
    setPrioridad,
    plazo,
    setPlazo,
    descripcion,
    setDescripcion,
    fotografiaB64,
    setFotografiaB64,
    handleImageChange,
    empresaSeleccionada
  } = useObservationForm();

  // Estados para control de envío y mensajes del overlay
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Función auxiliar para limitar a 5 decimales de forma segura
  const formatearCoordenada = (val: string | number | null) => {
    if (val === null || val === undefined || val === '') return '';
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toFixed(5);
  };

  // Función para abrir la URL web de mapas en cualquier dispositivo
  const abrirMapaPredeterminado = (lat: string | number, lng: string | number) => {
    if (!lat || !lng) return;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(webUrl, '_blank');
  };

  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idEmpresa) {
      alert('Debe seleccionar una empresa fiscalizada.');
      return;
    }
    if (!plazo || Number(plazo) <= 0) {
      alert('Debe ingresar un plazo válido en días hábiles.');
      return;
    }
    if (!descripcion.trim()) {
      alert('La descripción de la observación es obligatoria.');
      return;
    }
    if (!latitud || !longitud) {
      alert('No se ha podido capturar la ubicación GPS automáticamente. Asegúrese de otorgar permisos de ubicación.');
      return;
    }
    if (!fotografiaB64) {
      alert('Debe adjuntar o capturar una fotografía de evidencia obligatoriamente.');
      return;
    }

    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setShowPreview(false);
      setSubmitting(true);
      setErrorMessage('');

      await new Promise((r) => setTimeout(r, 50));

      const token = localStorage.getItem('access_token');
      
      const payload = {
        id_empresa: idEmpresa,
        prioridad: prioridad,
        dias_plazo: plazo,
        descripcion: descripcion,
        ubicacion_observacion: {
          latitud: latitud,
          longitud: longitud
        },
        fotografia_b64: fotografiaB64
      };

      await Promise.all([
        api.post('/observaciones/', payload, {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);

      setSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error('Error al registrar observación:', err);
      setSubmitting(false);
      setErrorMessage(err.response?.data?.error || 'Ocurrió un error al guardar la observación.');
    }
  };

  return (
    <div 
      className="create-obs-container"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="create-obs-card">
        <div className="create-obs-topbar">
          <div className="create-obs-header">
            <h2>Registrar Observación en Terreno</h2>
            <p>Ingrese los detalles y la evidencia recopilada durante la fiscalización.</p>
          </div>
        </div>

        {errorMessage && <div className="dashboard-error-banner">{errorMessage}</div>}

        <form onSubmit={handleOpenPreview} className="create-obs-form">
          <div className="form-group">
            <label>Empresa Fiscalizadora <span className="required-star">*</span></label>
            <select 
              value={idEmpresa} 
              onChange={(e) => setIdEmpresa(e.target.value)} 
              required
            >
              <option value="">Seleccione una empresa...</option>
              {empresas.map((emp) => (
                <option key={emp.id_empresa} value={emp.id_empresa}>
                  {emp.razon_social} ({emp.rut_empresa})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prioridad</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                <option>Urgente</option>
                <option>Muy alta</option>
                <option>Alta</option>
                <option>Normal</option>
                <option>Baja</option>
              </select>
            </div>
            <div className="form-group">
              <label>Plazo (Días hábiles) <span className="required-star">*</span></label>
              <input 
                type="number" 
                value={plazo} 
                onChange={(e) => setPlazo(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descripción de la Observación <span className="required-star">*</span></label>
            <textarea 
              rows={4} 
              placeholder="Detalle la observación encontrada en terreno..." 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitud</label>
              <input 
                type="text" 
                value={formatearCoordenada(latitud)} 
                readOnly 
                className="input-readonly"
                placeholder="Obteniendo latitud..." 
              />
            </div>
            <div className="form-group">
              <label>Longitud</label>
              <input 
                type="text" 
                value={formatearCoordenada(longitud)} 
                readOnly 
                className="input-readonly"
                placeholder="Obteniendo longitud..." 
              />
            </div>
          </div>

          {/* Botón de mapa ubicado abajo de lat/long formateadas */}
          {latitud && longitud && (
            <div className="form-group" style={{ marginTop: '-0.25rem' }}>
              <button
                type="button"
                onClick={() => abrirMapaPredeterminado(latitud, longitud)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  color: '#334155',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              >
                Abrir ubicación exacta en el mapa
              </button>
            </div>
          )}

          {/* SECCIÓN FOTOGRAFÍA */}
          <div className="form-group">
            <label>Fotografía de Evidencia (Obligatoria) <span className="required-star">*</span></label>
            
            <div className="media-picker-container">
              <label htmlFor="camera-input" className="media-btn-option camera-option">
                <span>Tomar Foto con Cámara</span>
              </label>
              <input 
                id="camera-input"
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={handleImageChange} 
                style={{ display: 'none' }}
              />

              <label htmlFor="gallery-input" className="media-btn-option gallery-option">
                <span>Seleccionar Archivo</span>
              </label>
              <input 
                id="gallery-input"
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }}
              />
            </div>

            {fotografiaB64 && (
              <div className="media-preview-box">
                <img src={fotografiaB64} alt="Vista previa" className="media-thumb" />
                <div className="media-info-text">
                  <span className="success-text">Fotografía cargada correctamente</span>
                  <button 
                    type="button" 
                    onClick={() => setFotografiaB64('')} 
                    className="btn-remove-image"
                  >
                    Cambiar / Quitar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleVolver} 
              className="btn-cancelar"
            >
              Volver
            </button>
            <button 
              type="submit" 
              className="btn-submit"
            >
              Revisar y Enviar
            </button>
          </div>
        </form>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN */}
      {showPreview && (
        <div className="obs-modal-backdrop">
          <div className="obs-modal-card">
            <h3>🔍 Previsualización de la Observación</h3>
            <p className="obs-modal-subtitle">
              Verifique que los datos ingresados sean correctos antes de registrar formalmente la observación en terreno.
            </p>

            <div className="obs-preview-content">
              <div className="obs-preview-item highlight">
                <strong>Empresa Fiscalizada:</strong> <span className="text-empresa">{empresaSeleccionada?.razon_social}</span> ({empresaSeleccionada?.rut_empresa})
              </div>

              <div className="form-row">
                <div className="obs-preview-item">
                  <strong>Prioridad:</strong> {prioridad}
                </div>
                <div className="obs-preview-item">
                  <strong>Plazo:</strong> {plazo} días hábiles
                </div>
              </div>

              <div className="obs-preview-item">
                <strong>Descripción:</strong>
                <p className="obs-preview-desc">{descripcion}</p>
              </div>

              <div className="form-row">
                <div className="obs-preview-item">
                  <strong>Latitud GPS:</strong> {formatearCoordenada(latitud) || 'No disponible'}
                </div>
                <div className="obs-preview-item">
                  <strong>Longitud GPS:</strong> {formatearCoordenada(longitud) || 'No disponible'}
                </div>
              </div>

              {latitud && longitud && (
                <div className="obs-preview-item" style={{ marginTop: '-0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => abrirMapaPredeterminado(latitud, longitud)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '0.4rem 0.8rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, width: '100%' }}
                  >
                    Abrir ubicación en la aplicación de mapas
                  </button>
                </div>
              )}

              {fotografiaB64 && (
                <div className="obs-preview-item">
                  <strong>Fotografía de Evidencia Adjunta:</strong>
                  <div className="obs-preview-img-container">
                    <img src={fotografiaB64} alt="Evidencia" className="obs-preview-img" />
                  </div>
                </div>
              )}
            </div>

            <div className="obs-modal-actions">
              <button 
                type="button" 
                onClick={() => setShowPreview(false)}
                disabled={submitting}
                className="btn-modal-back"
              >
                Volver a Editar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="btn-modal-confirm"
              >
                Confirmar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card">
            <div className="spinner-loader"></div>
            <h3>Registrando observación...</h3>
            <p>Por favor espere mientras se transmite la evidencia y se confirma el registro en el servidor.</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card success-card">
            <div className="success-icon-badge">✓</div>
            <h3>¡Registro Exitoso!</h3>
            <p>La observación en terreno ha sido guardada correctamente. Redirigiendo al panel...</p>
          </div>
        </div>
      )}
    </div>
  );
}
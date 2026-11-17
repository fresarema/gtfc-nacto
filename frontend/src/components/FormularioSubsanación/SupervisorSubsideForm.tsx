import React, { useState } from 'react';
import './SupervisorSubsideForm.css';

interface SupervisorSubsideFormProps {
  ticketId: number | string;
  onSuccess: () => void;
  onCancel: () => void;
  apiService: any; 
}

export default function SupervisorSubsideForm({ ticketId, onSuccess, onCancel, apiService }: SupervisorSubsideFormProps) {
  const [comentario, setComentario] = useState<string>('');
  const [fotoEvidencia, setFotoEvidencia] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario && !fotoEvidencia) {
      alert('Debe ingresar un comentario de la solución o adjuntar evidencia fotográfica.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('descripcion_solucion', comentario);
      if (fotoEvidencia) {
        formData.append('foto_evidencia', fotoEvidencia);
      }

      await apiService.post(`/tickets/${ticketId}/subsanar/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Subsanación enviada exitosamente.');
      onSuccess();
    } catch (err: any) {
      console.error('Error al enviar subsanación:', err);
      alert('Ocurrió un error al enviar la subsanación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="supervisor-subsanar-section">
      <h3>Módulo de Subsanación y Carga de Evidencia</h3>
      <form onSubmit={handleSubmit} className="subsanar-form">
        <div className="form-group">
          <label>Descripción de la Solución / Acciones Realizadas</label>
          <textarea 
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Detalle las acciones adoptadas para corregir la observación en terreno..."
            required
          />
        </div>

        <div className="form-group">
          <label>Fotografía de Evidencia Subsanada</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => e.target.files && setFotoEvidencia(e.target.files[0])}
            required
          />
        </div>

        <div className="subsanar-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-cancel"
          >
            Volver al Panel
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="btn-submit-subsanacion"
          >
            {submitting ? 'Enviando...' : 'Enviar Evidencia de Subsanación'}
          </button>
        </div>
      </form>
    </div>
  );
}
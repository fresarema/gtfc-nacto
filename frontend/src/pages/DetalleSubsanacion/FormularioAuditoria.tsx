import React, { useState } from 'react';
import styles from './FormularioAuditoria.module.css';

interface FormularioAuditoriaProps {
  onAuditar: (decision: 'Cerrado' | 'Rechazado', comentario: string) => Promise<void>;
  auditando: boolean;
}

export const FormularioAuditoria: React.FC<FormularioAuditoriaProps> = ({ onAuditar, auditando }) => {
  const [comentarioAuditoria, setComentarioAuditoria] = useState<string>('');

  const handleDecision = (decision: 'Cerrado' | 'Rechazado') => {
    if (!comentarioAuditoria.trim()) {
      alert('Por favor ingresa un comentario u observación para la auditoría.');
      return;
    }
    onAuditar(decision, comentarioAuditoria);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Auditoría y Validación Municipal</h3>
      
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Comentario de Aprobación o Motivo de Rechazo
        </label>
        <textarea
          rows={3}
          value={comentarioAuditoria}
          onChange={(e) => setComentarioAuditoria(e.target.value)}
          placeholder="Ingresa los detalles de la auditoría..."
          className={styles.textarea}
        />
      </div>

      <div className={styles.buttonGroup}>
        <button 
          type="button"
          disabled={auditando}
          onClick={() => handleDecision('Cerrado')}
          className={styles.btnAprobar}
        >
          {auditando ? 'Procesando...' : '✓ Aprobar y Cerrar Ticket'}
        </button>

        <button 
          type="button"
          disabled={auditando}
          onClick={() => handleDecision('Rechazado')}
          className={styles.btnRechazar}
        >
          {auditando ? 'Procesando...' : '✕ Rechazar y Devolver'}
        </button>
      </div>
    </div>
  );
};
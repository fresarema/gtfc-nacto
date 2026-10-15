import React, { useState } from 'react';

interface Props {
  estado: string;
  onAuditar: (nuevoEstado: 'Cerrado' | 'Rechazado', comentario: string) => void;
  submitting: boolean;
}

export const AuditActionsForm: React.FC<Props> = ({ estado, onAuditar, submitting }) => {
  const [comentario, setComentario] = useState('');
  
  const estadoLower = (estado || '').toLowerCase();
  const esEstadoFinal = ['cerrado', 'resuelto', 'aprobado'].includes(estadoLower);
  
  // 🔒 Estados donde el ticket está abierto o en curso y la empresa aún no envía la subsanación
  const esEstadoEnEspera = ['abierto', 'pendiente', 'en plazo', 'en curso'].includes(estadoLower);

  // Si ya está cerrado o resuelto
  if (esEstadoFinal) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f1f5f9',
        borderRadius: '8px',
        color: '#334155',
        fontWeight: 600,
        textAlign: 'center',
        border: '1px solid #cbd5e1'
      }}>
        Este ticket ya fue auditado y finalizado con estado: {' '}
        <span style={{ color: '#16a34a', textTransform: 'uppercase' }}>{estado}</span>
      </div>
    );
  }

  // Si está abierto o esperando respuesta de la empresa
  if (esEstadoEnEspera) {
    return (
      <div style={{
        padding: '1.25rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        color: '#334155',
        textAlign: 'center',
        border: '1px solid #e2e8f0',
        marginTop: '1.5rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Estado: En espera de la Empresa</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          Este ticket se encuentra abierto. Las acciones de auditoría municipal se habilitarán una vez que el supervisor adjunte la evidencia de subsanación.
        </p>
      </div>
    );
  }

  // 🟢 Si el estado es de revisión / subsanado, mostramos el formulario de auditoría municipal
  const handleAprobar = () => {
    if (!comentario.trim()) {
      alert('Por favor ingresa un comentario de auditoría.');
      return;
    }
    onAuditar('Cerrado', comentario);
  };

  const handleRechazar = () => {
    if (!comentario.trim()) {
      alert('Por favor ingresa un comentario de auditoría.');
      return;
    }
    onAuditar('Rechazado', comentario);
  };

  return (
    <div style={{
      background: '#ffffff',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      marginTop: '1.5rem'
    }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1e293b' }}>
        Comentario de Auditoría Municipal:
      </label>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Ingrese sus observaciones antes de aprobar o rechazar el ticket..."
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '0.6rem',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          marginBottom: '1rem',
          outline: 'none',
          boxSizing: 'border-box'
        }}
        disabled={submitting}
      />

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button
          onClick={handleAprobar}
          disabled={submitting}
          style={{
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          ✓ Aprobar y Cerrar Ticket
        </button>

        <button
          onClick={handleRechazar}
          disabled={submitting}
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          ✕ Rechazar y Devolver
        </button>
      </div>
    </div>
  );
};

export default AuditActionsForm;
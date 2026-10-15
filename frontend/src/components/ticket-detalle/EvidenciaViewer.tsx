import React from 'react';

interface Props {
  evidencia: {
    url_foto?: string;
    descripcion_solucion?: string;
  };
  baseUrl: string;
}

export const EvidenciaViewer: React.FC<Props> = ({ evidencia, baseUrl }) => {
  if (!evidencia) return null;

  const urlCompleta = evidencia.url_foto?.startsWith('http')
    ? evidencia.url_foto
    : `${baseUrl}${evidencia.url_foto}`;

  return (
    <div style={{
      background: '#ffffff',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem'
    }}>
      <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.1rem' }}>
        Evidencia de Subsanación (Supervisor / Empresa)
      </h3>

      {evidencia.url_foto && (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <img
            src={urlCompleta}
            alt="Evidencia de Subsanación"
            style={{
              maxWidth: '100%',
              maxHeight: '350px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {evidencia.descripcion_solucion && (
        <div style={{ marginTop: '1rem' }}>
          <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Descripción de los Trabajos Realizados:
          </strong>
          <p style={{ color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            {evidencia.descripcion_solucion}
          </p>
        </div>
      )}
    </div>
  );
};
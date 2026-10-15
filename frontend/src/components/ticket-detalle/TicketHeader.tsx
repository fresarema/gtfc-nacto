import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  idTicket: number | string;
  codConsultaExterna?: string;
}

export const TicketHeader: React.FC<Props> = ({ idTicket, codConsultaExterna }) => {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{
          background: 'transparent',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer',
          fontWeight: 600,
          marginBottom: '1rem',
          fontSize: '0.95rem'
        }}
      >
        ← Volver
      </button>

      <header>
        <h1 style={{ fontSize: '1.8rem', color: '#0f172a', margin: 0 }}>
          Detalle de Ticket #{idTicket}
        </h1>
        {codConsultaExterna && (
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Código Externo: {codConsultaExterna}
          </p>
        )}
      </header>
    </div>
  );
};
import React from 'react';

interface TicketData {
  ubicacion?: unknown;
  ubicacion_observacion?: unknown;
  direccion?: unknown;
  fecha_registro?: string;
  estado?: string;
  descripcion?: string;
  motivo_rechazo?: string;
}

interface Props {
  ticketData: TicketData;
}

export const TicketInfoCard: React.FC<Props> = ({ ticketData }) => {
  const ubicacionTexto = ticketData?.ubicacion || ticketData?.ubicacion_observacion || ticketData?.direccion;

  // Generar URL de Google Maps basada en el texto de la ubicación
  const renderUbicacionConEnlace = () => {
    if (!ubicacionTexto) return 'Sin dirección registrada';
    
    const textoStr = String(ubicacionTexto);
    
    // Codificamos el texto para que sea seguro en una URL de búsqueda de Google Maps
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoStr)}`;

    return (
      <a 
        href={googleMapsUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          color: '#2563eb',
          textDecoration: 'underline',
          fontWeight: 500,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
        title="Ver ubicación en Google Maps"
      >

        <span style={{ fontSize: '0.8rem' }}>(Ver en Maps ↗)</span>
      </a>
    );
  };

  return (
    <div style={{
      background: '#ffffff',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
          Fecha de Registro
        </strong>
        <span style={{ color: '#1e293b', fontWeight: 500 }}>{ticketData?.fecha_registro || 'No registrada'}</span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
          Estado Actual
        </strong>
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          backgroundColor: '#e2e8f0',
          color: '#334155',
          marginTop: '4px'
        }}>
          {ticketData?.estado || 'Desconocido'}
        </span>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
          Descripción del Inspector / Ticket
        </strong>
        <p style={{ color: '#334155', margin: '4px 0 0 0', lineHeight: 1.5 }}>
          {ticketData?.descripcion || 'Sin descripción'}
        </p>
      </div>

      <div>
        <strong style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
          Dirección / Ubicación
        </strong>
        <p style={{ color: '#334155', margin: '4px 0 0 0' }}>
          {renderUbicacionConEnlace()}
        </p>
      </div>

      {ticketData?.motivo_rechazo && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
          borderRadius: '4px',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          <strong>Motivo de rechazo previo:</strong> {ticketData.motivo_rechazo}
        </div>
      )}
    </div>
  );
};

export default TicketInfoCard;
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetalleTicket.module.css';

interface Observacion {
  id: number;
  titulo?: string;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
  foto?: string;
}

export const DetalleTicket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [observacion, setObservacion] = useState<Observacion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/observaciones/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al conectar con el servidor');
        }
        return response.json();
      })
      .then((data: Observacion[]) => {
        const encontrado = data.find((obs, index) => {
          const ticketId = obs.id ?? (index + 1);
          return String(ticketId) === String(id);
        });

        if (encontrado) {
          setObservacion(encontrado);
        } else {
          setError('No se encontró el detalle de la observación.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // NUEVA LÓGICA: Validar la observación para convertirla en Ticket oficial
  const handleValidarYCrearTicket = () => {
    // Si tu backend permite actualizar por PATCH, harías algo como esto:
    /*
    fetch(`http://localhost:8000/api/observaciones/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'validado' })
    })
    */

    alert(`¡Observación #${id} aprobada con éxito! Se ha generado el Ticket oficial para la empresa.`);
    navigate('/solicitudes-validacion');
  };

  if (loading) return <div className={styles.container}>Cargando detalle...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!observacion) return <div className={styles.container}>Observación no encontrada</div>;

  const ticketIdDisplay = observacion.id ?? id;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Volver a solicitudes
      </button>

      <div className={styles.cardDetail}>
        <div className={styles.headerRow}>
          <h1>Observación / Solicitud #{ticketIdDisplay}</h1>
          <span className={styles.badge}>{observacion.estado || 'Pendiente'}</span>
        </div>

        {observacion.foto && (
          <div className={styles.imageContainer}>
            <img src={observacion.foto} alt={`Evidencia ${ticketIdDisplay}`} className={styles.image} />
          </div>
        )}

        <div className={styles.infoGroup}>
          <p><strong>Ubicación GPS:</strong> {observacion.ubicacion || 'No especificada'}</p>
          <p><strong>Descripción detallada:</strong> {observacion.descripcion}</p>
          {observacion.fecha && <p><strong>Fecha de registro:</strong> {observacion.fecha}</p>}
        </div>

        <div className={styles.actions}>
          <button onClick={handleValidarYCrearTicket} className={styles.approveButton}>
            Aprobar y Generar Ticket Oficial
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleTicket;
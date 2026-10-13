import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './DetalleSubsanacion.module.css';

interface Observacion {
  id: number;
  descripcion: string;
  ubicacion: string;
  estado?: string;
  fecha?: string;
  foto?: string;
}

export const DetalleSubsanacion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [observacion, setObservacion] = useState<Observacion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [comentario, setComentario] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:8000/api/observaciones/')
      .then((response) => {
        if (!response.ok) throw new Error('Error al conectar con el servidor');
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
          setError('No se encontró el ticket especificado.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSubmitSubsanacion = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí realizarías la petición PATCH/PUT a Django enviando el estado 'subsanado' y la evidencia
    alert(`¡Evidencia enviada correctamente para el Ticket #${id}! El estado cambió a Subsanado.`);
    navigate('/subsanacion'); // O la ruta de la bandeja correspondiente
  };

  if (loading) return <div className={styles.container}>Cargando detalle del ticket...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!observacion) return <div className={styles.container}>Ticket no encontrado</div>;

  const ticketIdDisplay = observacion.id ?? id;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Volver a tickets validados
      </button>

      <div className={styles.cardDetail}>
        <div className={styles.headerRow}>
          <h1>Subsanar Ticket Oficial #{ticketIdDisplay}</h1>
          <span className={styles.badge}>{observacion.estado || 'Validado'}</span>
        </div>

        <div className={styles.infoGroup}>
          <p><strong>Ubicación:</strong> {observacion.ubicacion || 'No especificada'}</p>
          <p><strong>Descripción original del inspector:</strong> {observacion.descripcion}</p>
          {observacion.fecha && <p><strong>Fecha de emisión:</strong> {observacion.fecha}</p>}
        </div>

        <form onSubmit={handleSubmitSubsanacion} className={styles.formGroup}>
          <label className={styles.label}>Comentarios de resolución:</label>
          <textarea 
            className={styles.textarea}
            placeholder="Describe el trabajo realizado para corregir la incidencia..."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            required
          />

          <label className={styles.label}>Evidencia fotográfica de corrección:</label>
          <input 
            type="file" 
            accept="image/*" 
            className={styles.fileInput} 
            required 
          />

          <button type="submit" className={styles.submitButton}>
            Enviar Evidencia y Subsanar
          </button>
        </form>
      </div>
    </div>
  );
};

export default DetalleSubsanacion;
import React, { useState } from 'react';
import styles from './FormularioEvidencia.module.css';

interface FormularioEvidenciaProps {
  onEnviar: (descripcion: string, archivo: File) => Promise<void>;
  subiendo: boolean;
}

export const FormularioEvidencia: React.FC<FormularioEvidenciaProps> = ({ onEnviar, subiendo }) => {
  const [descripcionSolucion, setDescripcionSolucion] = useState<string>('');
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoEvidencia) {
      alert('Por favor adjunta una fotografía de evidencia.');
      return;
    }
    onEnviar(descripcionSolucion, archivoEvidencia);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <h3 className={styles.title}>Cargar Evidencia Corregida de Subsanación</h3>

      <div className={styles.formGroup}>
        <label className={styles.label}>Descripción de los trabajos realizados</label>
        <textarea
          rows={3}
          value={descripcionSolucion}
          onChange={(e) => setDescripcionSolucion(e.target.value)}
          placeholder="Detalla las acciones tomadas para corregir las observaciones..."
          required
          className={styles.textarea}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Fotografía de Evidencia</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivoEvidencia(e.target.files ? e.target.files[0] : null)}
          required
          className={styles.fileInput}
        />
      </div>

      <button 
        type="submit" 
        disabled={subiendo} 
        className={styles.submitButton}
      >
        {subiendo ? 'Enviando Evidencia...' : 'Enviar Evidencia Corregida'}
      </button>
    </form>
  );
};

export default FormularioEvidencia;
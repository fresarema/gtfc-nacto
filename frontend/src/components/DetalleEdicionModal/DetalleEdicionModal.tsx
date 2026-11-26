import React, { useEffect, useState } from 'react';
import './DetalleEdicionModal.css';

export interface CampoFormularioModal {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'select';
  value: string;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
  options?: { value: string; label: string }[];
}

interface DetalleEdicionModalProps {
  isOpen: boolean;
  titulo: string;
  campos: CampoFormularioModal[];
  onClose: () => void;
  onGuardar: (valores: Record<string, string>) => Promise<void> | void;
  onEliminar?: () => Promise<void> | void;
  mensajeConfirmacionEliminar?: string;
  guardando?: boolean;
  eliminando?: boolean;
  errorMensaje?: string;
}

export default function DetalleEdicionModal({
  isOpen,
  titulo,
  campos,
  onClose,
  onGuardar,
  onEliminar,
  mensajeConfirmacionEliminar = '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
  guardando = false,
  eliminando = false,
  errorMensaje = '',
}: DetalleEdicionModalProps) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmandoEliminar(false);
      return;
    }
    const inicial: Record<string, string> = {};
    campos.forEach((c) => {
      inicial[c.name] = c.value;
    });
    setValores(inicial);
    setConfirmandoEliminar(false);
  }, [isOpen, campos]);

  if (!isOpen) return null;

  const ocupado = guardando || eliminando;

  const handleChange = (name: string, val: string) => {
    setValores((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmandoEliminar) return;
    await onGuardar(valores);
  };

  const handleConfirmarEliminacion = async () => {
    if (!onEliminar) return;
    await onEliminar();
  };

  return (
    <div
      className="detalle-modal-backdrop"
      onClick={() => {
        if (!ocupado) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-modal-titulo"
    >
      <div className="detalle-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="detalle-modal-header">
          <h3 id="detalle-modal-titulo" className="detalle-modal-title">
            {titulo}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="detalle-modal-close"
            aria-label="Cerrar modal"
            disabled={ocupado}
          >
            ✕
          </button>
        </div>

        {errorMensaje && <div className="detalle-modal-error">{errorMensaje}</div>}

        {confirmandoEliminar ? (
          <div className="detalle-confirm-box" role="alert">
            <p className="detalle-confirm-title">Confirmar eliminación</p>
            <p className="detalle-confirm-text">{mensajeConfirmacionEliminar}</p>

            <div className="detalle-confirm-actions">
              <button
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                className="detalle-btn-cancelar"
                disabled={ocupado}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminacion}
                className="detalle-btn-confirmar-eliminar"
                disabled={ocupado}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="detalle-modal-form">
            <div className="detalle-modal-grid">
              {campos.map((campo) => {
                const inputId = `modal-campo-${campo.name}`;
                const val = valores[campo.name] ?? '';

                return (
                  <div
                    key={campo.name}
                    className={`detalle-modal-field ${campo.fullWidth ? 'detalle-modal-field--full' : ''}`}
                  >
                    <label htmlFor={inputId} className="detalle-modal-label">
                      {campo.label}
                    </label>

                    {campo.type === 'select' ? (
                      <select
                        id={inputId}
                        value={val}
                        onChange={(e) => handleChange(campo.name, e.target.value)}
                        required={campo.required}
                        disabled={ocupado}
                        className="detalle-modal-input"
                      >
                        {(campo.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        type={campo.type || 'text'}
                        value={val}
                        placeholder={campo.placeholder}
                        onChange={(e) => handleChange(campo.name, e.target.value)}
                        required={campo.required}
                        disabled={ocupado}
                        className="detalle-modal-input"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="detalle-modal-footer">
              {onEliminar ? (
                <button
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                  className="detalle-btn-eliminar"
                  disabled={ocupado}
                >
                  Eliminar
                </button>
              ) : (
                <span />
              )}

              <div className="detalle-modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="detalle-btn-cancelar"
                  disabled={ocupado}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="detalle-btn-guardar"
                  disabled={ocupado}
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
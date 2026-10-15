import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CrearUsuario.module.css';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '');

export const CrearUsuario: React.FC = () => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState<string>('');
  const [apellido, setApellido] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rol, setRol] = useState<string>('Usuario Municipal');
  const [idEmpresa, setIdEmpresa] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rol === 'Supervisor de Empresa Externa' && !idEmpresa) {
      setError('Debes especificar el ID de la empresa para un supervisor externo.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/api/usuarios/registrar/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          password,
          rol,
          id_empresa: idEmpresa ? Number(idEmpresa) : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudo registrar el usuario en el sistema.');
      }

      alert('¡Usuario registrado exitosamente!');
      navigate('/bandeja-municipal');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido al registrar el usuario.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Registro de Nuevo Usuario</h2>
      <p className={styles.subtitle}>Panel exclusivo de administración municipal para el alta de nuevas cuentas de acceso.</p>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer} style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Carlos"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                placeholder="Ej. Gómez"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@municipalidad.cl"
              autoComplete="email"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>Rol Asignado</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none' }}
            >
              <option value="Usuario Municipal">Usuario Municipal</option>
              <option value="Administrador">Administrador</option>
              <option value="Supervisor de Empresa Externa">Supervisor de Empresa Externa</option>
              <option value="Fiscalizador">Fiscalizador</option>
            </select>
          </div>

          {rol === 'Supervisor de Empresa Externa' && (
            <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', color: '#334155' }}>ID de Empresa Contratista</label>
              <input
                type="number"
                min="1"
                value={idEmpresa}
                onChange={(e) => setIdEmpresa(e.target.value)}
                required
                placeholder="Ej. 1"
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none' }}
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '6px' }}>
                Número identificador de la empresa asociada en la base de datos.
              </small>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ 
              background: '#2563eb', 
              color: '#fff', 
              padding: '0.75rem 1.5rem', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 600, 
              width: '100%',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Registrando usuario...' : '✓ Registrar Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CrearUsuario;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Credenciales inválidas o error en el servidor');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      
      const userRole = data.usuario.rol?.toLowerCase() || '';
      localStorage.setItem('userRole', userRole);

      if (userRole === 'fiscalizador') {
        navigate('/home', { replace: true });
      } else if (['supervisor de empresa externa', 'supervisor', 'admin', 'administrador', 'usuario municipal'].includes(userRole)) {
        navigate('/bandeja-municipal', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Iniciar Sesión</h2>
          <p className={styles.subtitle}>Plataforma de Fiscalización</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input 
              type="email" 
              className={styles.input}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="correo@dominio.cl"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <input 
              type="password" 
              className={styles.input}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" className={styles.buttonPrimary} disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.statusDot}></span>
          <span>Conectado al servidor de autenticación</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
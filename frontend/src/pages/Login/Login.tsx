import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../../utils/auth';
import styles from './Login.module.css';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !password.trim()) {
      setError('Por favor ingrese usuario y contraseña.');
      return;
    }

    setSession('token_demo_fiscalizador');
    navigate('/home');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sistema de Fiscalización</h1>
          <p className={styles.subtitle}>Ingrese sus credenciales de inspector</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Usuario / RUT</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: 12345678-9"
              className={styles.input}
              autoComplete="username"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.buttonPrimary}>
            Iniciar Sesión
          </button>
        </form>

        
      </div>
    </div>
  );
}
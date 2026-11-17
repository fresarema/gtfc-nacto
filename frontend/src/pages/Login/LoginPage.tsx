import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './LoginPage.css';
import fondo from '../../assets/whiteBG.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Petición POST enviando 'email' como espera views.py
      const response = await api.post('/auth/login/', {
        email: credentials.email,
        password: credentials.password,
      });

      // El backend devuelve el token en la clave "token"
      const token = response.data.token || response.data.access;

      if (token) {
        localStorage.setItem('access_token', token);

        if (response.data.usuario) {
          const usuario = response.data.usuario;
          localStorage.setItem('user_data', JSON.stringify(usuario));

          // Verificamos el rol para la redirección inteligente
          const rol = usuario.rol?.toLowerCase();

          if (rol === 'fiscalizador') {
            navigate('/fiscalizadorHome');
          } else {
            navigate('/dashboard'); // Redirige al panel general para admin, municipal o supervisor
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('El servidor no devolvió un token de acceso válido.');
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      if (err.response && (err.response.status === 400 || err.response.status === 401)) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error al conectar con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="login-container"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="login-card">
        <div className="login-header">
          <span className="login-badge">gtfc-nacto</span>
          <h2 className="login-title">Acceso de Fiscalizadores</h2>
          <p className="login-subtitle">Ingrese sus credenciales municipales</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              value={credentials.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              required
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Validando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
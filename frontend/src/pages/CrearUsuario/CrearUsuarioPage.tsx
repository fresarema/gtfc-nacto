import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './CrearUsuarioPage.css';
import fondo from '../../assets/whiteBG.png';

export default function CrearUsuarioPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('Fiscalizador');
  const [idEmpresa, setIdEmpresa] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const userRole = usuario?.rol?.toLowerCase() || '';
  const esAdmin = ['administrador', 'admin'].includes(userRole);

  if (!esAdmin) {
    return (
      <div className="dashboard-app-layout">
        <Navbar />
        <main className="dashboard-main-content">
          <div className="dashboard-error-banner">
            Acceso denegado. Sección exclusiva para Administradores.
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      
      const payload: any = {
        nombre,
        apellido,
        email,
        password,
        rol
      };

      if (rol === 'Supervisor de Empresa Externa') {
        if (!idEmpresa) {
          alert('Debe especificar el ID de la empresa para un Supervisor.');
          setSubmitting(false);
          return;
        }
        payload.id_empresa = Number(idEmpresa);
      }

      await api.post('/usuarios/registrar/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('¡Usuario registrado exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      alert(err.response?.data?.error || 'Ocurrió un error al registrar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="dashboard-app-layout"
      style={{ 
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.94), rgba(248, 250, 252, 0.94)), url(${fondo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="admin-form-card">
          <div className="admin-form-header">
            <h2>Registrar Nuevo Usuario</h2>
            <p>Complete los datos obligatorios y seleccione el rol correspondiente en el sistema.</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  placeholder="Ej. Juan" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input 
                  type="text" 
                  placeholder="Ej. Pérez" 
                  value={apellido} 
                  onChange={(e) => setApellido(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="juan.perez@municipio.cl" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rol de Usuario</label>
                <select value={rol} onChange={(e) => setRol(e.target.value)}>
                  <option value="Administrador">Administrador</option>
                  <option value="Usuario Municipal">Usuario Municipal</option>
                  <option value="Supervisor de Empresa Externa">Supervisor de Empresa Externa</option>
                  <option value="Fiscalizador">Fiscalizador</option>
                  <option value="Operario de Empresa Externa">Operario de Empresa Externa</option>
                </select>
              </div>

              {rol === 'Supervisor de Empresa Externa' && (
                <div className="form-group">
                  <label>ID de Empresa Asignada</label>
                  <input 
                    type="number" 
                    placeholder="Ej. 1" 
                    value={idEmpresa} 
                    onChange={(e) => setIdEmpresa(e.target.value)} 
                    required 
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancelar">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Registrando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
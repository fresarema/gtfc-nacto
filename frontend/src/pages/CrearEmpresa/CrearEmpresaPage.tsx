import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './CrearEmpresaPage.css';
import fondo from '../../assets/whiteBG.png';

export default function CrearEmpresaPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    razon_social: '',
    rut_empresa: '',
    direccion_comercial: '',
    direccion_base_nacimiento: '',
    nombre_admin_contrato: '',
    email_admin_contrato: '',
    telefono_admin_contrato: '',
    nombre_supervisor: '',
    email_supervisor: '',
    telefono_supervisor: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';
  const esAdmin = ['administrador', 'admin'].includes(rol);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      
      await api.post('/empresas/crear/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('¡Empresa creada exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error al registrar empresa:', err);
      alert(err.response?.data?.error || 'Ocurrió un error al guardar la empresa.');
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
            <h2>Registrar Nueva Empresa Externa</h2>
            <p>Información corporativa y de contactos requerida.</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Razón Social <span style={{ color: '#e11d48' }}>*</span></label>
                <input 
                  type="text" 
                  name="razon_social"
                  placeholder="Ej. Constructora del Sur SPA" 
                  value={formData.razon_social} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>RUT Empresa <span style={{ color: '#e11d48' }}>*</span></label>
                <input 
                  type="text" 
                  name="rut_empresa"
                  placeholder="Ej. 76.543.210-k" 
                  value={formData.rut_empresa} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Dirección Comercial</label>
                <input 
                  type="text" 
                  name="direccion_comercial"
                  placeholder="Ej. Av. Alemania 123" 
                  value={formData.direccion_comercial} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Dirección Base Nacimiento</label>
                <input 
                  type="text" 
                  name="direccion_base_nacimiento"
                  placeholder="Ej. Ruta Q-34 km 4" 
                  value={formData.direccion_base_nacimiento} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <h3 className="form-section-title">Administrador de Contrato / Jefe Zonal</h3>
            <div className="form-row-three">
              <div className="form-group">
                <label>Nombre Administrador / Jefe Zonal</label>
                <input 
                  type="text" 
                  name="nombre_admin_contrato"
                  placeholder="Nombre completo" 
                  value={formData.nombre_admin_contrato} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico Admin</label>
                <input 
                  type="email" 
                  name="email_admin_contrato"
                  placeholder="admin@empresa.cl" 
                  value={formData.email_admin_contrato} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Teléfono Admin</label>
                <input 
                  type="text" 
                  name="telefono_admin_contrato"
                  placeholder="+569..." 
                  value={formData.telefono_admin_contrato} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <h3 className="form-section-title">Supervisor (Contraparte Local)</h3>
            <div className="form-row-three">
              <div className="form-group">
                <label>Nombre Supervisor</label>
                <input 
                  type="text" 
                  name="nombre_supervisor"
                  placeholder="Nombre supervisor" 
                  value={formData.nombre_supervisor} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Correo Electrónico Supervisor</label>
                <input 
                  type="email" 
                  name="email_supervisor"
                  placeholder="supervisor@empresa.cl" 
                  value={formData.email_supervisor} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Teléfono Supervisor</label>
                <input 
                  type="text" 
                  name="telefono_supervisor"
                  placeholder="+569..." 
                  value={formData.telefono_supervisor} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancelar">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Guardando...' : 'Guardar Empresa'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
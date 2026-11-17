import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './CrearContratoPage.css';
import fondo from '../../assets/whiteBG.png';

export default function CrearContratoPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id_empresa: '',
    nombre_contrato: '',
    id_licitacion: '',
    vigencia_contrato: '',
    fecha_inicio: '',
    fecha_termino: '',
    monto_contrato_actualizado: '',
    ordenes_compra: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const rol = usuario?.rol?.toLowerCase() || '';
  const esAdmin = ['administrador', 'admin'].includes(rol);

  useEffect(() => {
    if (esAdmin) {
      fetchEmpresas();
    }
  }, [esAdmin]);

  const fetchEmpresas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/empresas/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresas(response.data || []);
    } catch (err) {
      console.error('Error al cargar empresas para el contrato:', err);
    }
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      
      await api.post('/contratos/crear/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('¡Contrato registrado exitosamente!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error al registrar contrato:', err);
      alert(err.response?.data?.error || 'Ocurrió un error al guardar el contrato.');
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
            <h2>Registrar Nuevo Contrato</h2>
            <p>Información del contrato requerida por la institución.</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Seleccionar Empresa <span style={{ color: '#e11d48' }}>*</span></label>
              <select 
                name="id_empresa"
                value={formData.id_empresa} 
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una empresa...</option>
                {empresas.map((emp) => (
                  <option key={emp.id_empresa} value={emp.id_empresa}>
                    {emp.razon_social} ({emp.rut_empresa})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Contrato <span style={{ color: '#e11d48' }}>*</span></label>
                <input 
                  type="text" 
                  name="nombre_contrato"
                  placeholder="Ej. Mantención Vial Zona Norte" 
                  value={formData.nombre_contrato} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>ID Licitación</label>
                <input 
                  type="text" 
                  name="id_licitacion"
                  placeholder="Ej. 2345-12-LE26" 
                  value={formData.id_licitacion} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vigencia del Contrato</label>
                <input 
                  type="text" 
                  name="vigencia_contrato"
                  placeholder="Ej. 24 Meses" 
                  value={formData.vigencia_contrato} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Monto del Contrato Actualizado ($)</label>
                <input 
                  type="number" 
                  name="monto_contrato_actualizado"
                  placeholder="Actualizable por reajuste IPC" 
                  value={formData.monto_contrato_actualizado} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Inicio del Contrato <span style={{ color: '#e11d48' }}>*</span></label>
                <input 
                  type="date" 
                  name="fecha_inicio"
                  value={formData.fecha_inicio} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Término del Contrato <span style={{ color: '#e11d48' }}>*</span></label>
                <input 
                  type="date" 
                  name="fecha_termino"
                  value={formData.fecha_termino} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Órdenes de Compra (Puede ingresar más de una)</label>
              <textarea 
                name="ordenes_compra"
                rows={3}
                placeholder="Ej. OC-10023, OC-10045..."
                value={formData.ordenes_compra}
                onChange={handleChange}
                style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontFamily: 'inherit' }}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancelar">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Guardando...' : 'Guardar Contrato'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
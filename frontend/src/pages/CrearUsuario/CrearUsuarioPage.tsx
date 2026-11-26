import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import './CrearUsuarioPage.css';
import fondo from '../../assets/whiteBG.png';

interface EmpresaItem {
  id_empresa?: number;
  id?: number;
  razon_social?: string;
  nombre?: string;
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function CrearUsuarioPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('Fiscalizador');
  const [idEmpresa, setIdEmpresa] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([]);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(false);
  const [errorEmpresas, setErrorEmpresas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const userDataString = localStorage.getItem('user_data');
  const usuario = userDataString ? JSON.parse(userDataString) : null;
  const userRole = usuario?.rol?.toLowerCase() || '';
  const esAdmin = ['administrador', 'admin'].includes(userRole);

  useEffect(() => {
    if (!esAdmin) return;

    let activo = true;
    setCargandoEmpresas(true);
    setErrorEmpresas('');

    const token = localStorage.getItem('access_token');
    api
      .get('/empresas/', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        if (!activo) return;
        const lista = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : [];
        setEmpresas(lista);
      })
      .catch((err) => {
        if (!activo) return;
        console.error('Error al cargar empresas:', err);
        setErrorEmpresas('No se pudieron cargar las empresas existentes.');
      })
      .finally(() => {
        if (activo) setCargandoEmpresas(false);
      });

    return () => {
      activo = false;
    };
  }, [esAdmin]);

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

  const obtenerIdEmpresa = (empresa: EmpresaItem): number | undefined =>
    empresa.id_empresa ?? empresa.id;

  const obtenerNombreEmpresa = (empresa: EmpresaItem): string => {
    const id = obtenerIdEmpresa(empresa);
    return empresa.razon_social || empresa.nombre || (id ? `Empresa #${id}` : 'Empresa');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (rol === 'Supervisor de Empresa Externa' && !idEmpresa) {
      setErrorMessage('Debe seleccionar una empresa para un Supervisor.');
      return;
    }

    try {
      setSubmitting(true);

      await esperar(2000);

      const token = localStorage.getItem('access_token');
      const payload: Record<string, unknown> = {
        nombre,
        apellido,
        email,
        password,
        rol,
      };

      if (rol === 'Supervisor de Empresa Externa') {
        payload.id_empresa = Number(idEmpresa);
      }

      await api.post('/usuarios/registrar/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubmitting(false);
      setSuccessMessage(true);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      setSubmitting(false);
      setErrorMessage(err.response?.data?.error || 'Ocurrió un error al registrar el usuario.');
    }
  };

  return (
    <div
      className="dashboard-app-layout crear-usuario-bg"
      style={{
        backgroundImage: `url(${fondo})`,
      }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="admin-form-card">
          <div className="admin-form-header">
            <h2>Registrar Nuevo Usuario</h2>
            <p>Complete los datos obligatorios y seleccione el rol correspondiente en el sistema.</p>
          </div>

          {errorMessage && <div className="dashboard-error-banner">{errorMessage}</div>}

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
                <select
                  value={rol}
                  onChange={(e) => {
                    const nuevoRol = e.target.value;
                    setRol(nuevoRol);
                    if (nuevoRol !== 'Supervisor de Empresa Externa') {
                      setIdEmpresa('');
                    }
                  }}
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Usuario Municipal">Usuario Municipal</option>
                  <option value="Supervisor de Empresa Externa">Supervisor de Empresa Externa</option>
                  <option value="Fiscalizador">Fiscalizador</option>
                  <option value="Operario de Empresa Externa">Operario de Empresa Externa</option>
                </select>
              </div>

              {rol === 'Supervisor de Empresa Externa' && (
                <div className="form-group">
                  <label>Empresa Asignada</label>
                  <select
                    value={idEmpresa}
                    onChange={(e) => setIdEmpresa(e.target.value)}
                    disabled={cargandoEmpresas}
                    required
                  >
                    <option value="">
                      {cargandoEmpresas ? 'Cargando empresas...' : 'Seleccione una empresa'}
                    </option>
                    {empresas.map((emp, idx) => {
                      const id = obtenerIdEmpresa(emp);
                      if (id === undefined) return null;
                      return (
                        <option key={id ?? idx} value={String(id)}>
                          {obtenerNombreEmpresa(emp)}
                        </option>
                      );
                    })}
                  </select>
                  {errorEmpresas && <span className="form-error-text">{errorEmpresas}</span>}
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

      {submitting && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card">
            <div className="spinner-loader"></div>
            <h3>Registrando usuario...</h3>
            <p>Por favor espere mientras se procesa y confirma el registro en el servidor.</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="submitting-overlay">
          <div className="submitting-alert-card success-card">
            <div className="success-icon-badge">✓</div>
            <h3>¡Registro Exitoso!</h3>
            <p>El usuario ha sido creado correctamente. Redirigiendo al panel...</p>
          </div>
        </div>
      )}
    </div>
  );
}
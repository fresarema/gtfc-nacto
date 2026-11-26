import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import DetalleEdicionModal, {
  type CampoFormularioModal,
} from '../../components/DetalleEdicionModal/DetalleEdicionModal';
import './UsuariosPage.css';
import fondo from '../../assets/whiteBG.png';

interface UsuarioItem {
  id_usuario?: number;
  id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  id_empresa?: number | null;
  empresa_nombre?: string | null;
  razon_social?: string | null;
}

interface EmpresaOption {
  id_empresa?: number;
  id?: number;
  razon_social?: string;
  nombre?: string;
}

const ROLES_SISTEMA = [
  'Administrador',
  'Usuario Municipal',
  'Supervisor de Empresa Externa',
  'Fiscalizador',
  'Operario de Empresa Externa',
];

const ROLES_CON_EMPRESA = ['Supervisor de Empresa Externa', 'Operario de Empresa Externa'];

function getUsuarioId(usr: UsuarioItem): number | undefined {
  return usr.id_usuario ?? usr.id;
}

export default function UsuariosPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioItem | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const cargarDatos = useCallback(async (signal?: { cancelled: boolean }) => {
    setCargando(true);
    setError('');
    try {
      const headers = getAuthHeaders();
      const [resUsuarios, resEmpresas] = await Promise.all([
        api.get('/usuarios/', { headers }),
        api.get('/empresas/', { headers }).catch(() => ({ data: [] })),
      ]);

      if (signal?.cancelled) return;

      const listaUsuarios: UsuarioItem[] = Array.isArray(resUsuarios.data)
        ? resUsuarios.data
        : Array.isArray(resUsuarios.data?.results)
          ? resUsuarios.data.results
          : [];

      const listaEmpresas: EmpresaOption[] = Array.isArray(resEmpresas.data)
        ? resEmpresas.data
        : Array.isArray(resEmpresas.data?.results)
          ? resEmpresas.data.results
          : [];

      setUsuarios(listaUsuarios);
      setEmpresas(listaEmpresas);
    } catch (err) {
      if (signal?.cancelled) return;
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar los usuarios registrados.');
    } finally {
      if (!signal?.cancelled) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const state = { cancelled: false };
    cargarDatos(state);
    return () => {
      state.cancelled = true;
    };
  }, [cargarDatos]);

  const rolesDisponibles = useMemo(() => {
    const rolesSet = new Set<string>(ROLES_SISTEMA);
    usuarios.forEach((u) => {
      if (u.rol) rolesSet.add(u.rol);
    });
    return Array.from(rolesSet);
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return usuarios.filter((usr) => {
      const cumpleRol = !filtroRol || (usr.rol || '').toLowerCase() === filtroRol.toLowerCase();
      if (!cumpleRol) return false;

      if (!termino) return true;
      const nombreCompleto = `${usr.nombre || ''} ${usr.apellido || ''}`.toLowerCase();
      const correo = (usr.email || '').toLowerCase();
      const empresa = (usr.empresa_nombre || usr.razon_social || '').toLowerCase();
      return (
        nombreCompleto.includes(termino) ||
        correo.includes(termino) ||
        empresa.includes(termino)
      );
    });
  }, [usuarios, busqueda, filtroRol]);

  const camposUsuario: CampoFormularioModal[] = useMemo(() => {
    if (!usuarioSeleccionado) return [];

    const opcionesRol = rolesDisponibles.map((r) => ({ value: r, label: r }));
    const opcionesEmpresa = [
      { value: '', label: 'Sin empresa / Seleccionar...' },
      ...empresas
        .map((emp) => {
          const id = emp.id_empresa ?? emp.id;
          if (!id) return null;
          return {
            value: String(id),
            label: emp.razon_social || emp.nombre || `Empresa #${id}`,
          };
        })
        .filter((item): item is { value: string; label: string } => item !== null),
    ];

    return [
      {
        name: 'nombre',
        label: 'Nombre',
        type: 'text',
        value: usuarioSeleccionado.nombre || '',
        required: true,
      },
      {
        name: 'apellido',
        label: 'Apellido',
        type: 'text',
        value: usuarioSeleccionado.apellido || '',
        required: true,
      },
      {
        name: 'email',
        label: 'Correo electrónico',
        type: 'email',
        value: usuarioSeleccionado.email || '',
        required: true,
      },
      {
        name: 'rol',
        label: 'Rol',
        type: 'select',
        value: usuarioSeleccionado.rol || ROLES_SISTEMA[0],
        options: opcionesRol,
        required: true,
      },
      {
        name: 'id_empresa',
        label: 'Empresa asociada (si aplica)',
        type: 'select',
        value: usuarioSeleccionado.id_empresa ? String(usuarioSeleccionado.id_empresa) : '',
        options: opcionesEmpresa,
      },
    ];
  }, [usuarioSeleccionado, rolesDisponibles, empresas]);

  const abrirModal = (usr: UsuarioItem) => {
    setMensajeExito('');
    setError('');
    setErrorModal('');
    setUsuarioSeleccionado(usr);
  };

  const cerrarModal = () => {
    if (guardando || eliminando) return;
    setUsuarioSeleccionado(null);
    setErrorModal('');
  };

  const handleGuardar = async (valores: Record<string, string>) => {
    if (!usuarioSeleccionado) return;
    const id = getUsuarioId(usuarioSeleccionado);
    if (!id) return;

    const nombre = (valores.nombre || '').trim();
    const apellido = (valores.apellido || '').trim();
    const email = (valores.email || '').trim();
    const rol = (valores.rol || '').trim();
    const idEmpresaStr = (valores.id_empresa || '').trim();

    if (!nombre || !apellido || !email || !rol) {
      setErrorModal('Nombre, apellido, correo y rol son obligatorios.');
      return;
    }

    const requiereEmpresa = ROLES_CON_EMPRESA.includes(rol);
    if (requiereEmpresa && !idEmpresaStr) {
      setErrorModal(`Debes seleccionar una empresa asociada para el rol ${rol}.`);
      return;
    }

    setGuardando(true);
    setErrorModal('');

    try {
      const payload = {
        nombre,
        apellido,
        email,
        rol,
        id_empresa: requiereEmpresa ? Number(idEmpresaStr) : null,
      };

      const res = await api.patch(`/usuarios/${id}/`, payload, {
        headers: getAuthHeaders(),
      });

      const actualizado: UsuarioItem = res.data?.usuario ?? {
        ...usuarioSeleccionado,
        ...payload,
      };

      setUsuarios((prev) =>
        prev.map((item) => (getUsuarioId(item) === id ? { ...item, ...actualizado } : item))
      );
      setMensajeExito('Usuario actualizado correctamente.');
      setUsuarioSeleccionado(null);
    } catch (err: unknown) {
      const respError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErrorModal(respError || 'No se pudo actualizar el usuario.');
    } finally {
      setGuardando(false);
    }
  };

const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    const id = getUsuarioId(usuarioSeleccionado);
    if (!id) return;

    const nombreEtiqueta =
      [usuarioSeleccionado.nombre, usuarioSeleccionado.apellido].filter(Boolean).join(' ') ||
      usuarioSeleccionado.email ||
      `ID ${id}`;

    setEliminando(true);
    setErrorModal('');

    try {
      await api.delete(`/usuarios/${id}/`, { headers: getAuthHeaders() });
      setUsuarios((prev) => prev.filter((item) => getUsuarioId(item) !== id));
      setMensajeExito(`Usuario "${nombreEtiqueta}" eliminado.`);
      setUsuarioSeleccionado(null);
    } catch (err: unknown) {
      const respError =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      const esRegistroAsociado =
        respError.toLowerCase().includes('registros asociados') ||
        respError.toLowerCase().includes('restricted foreign keys') ||
        respError.toLowerCase().includes('historialticket') ||
        respError.toLowerCase().includes('referenced through');

      setErrorModal(
        esRegistroAsociado
          ? 'Este usuario tiene registros asociados'
          : respError || 'No se pudo eliminar el usuario.'
      );
    } finally {
      setEliminando(false);
    }
  };

  const etiquetaUsuarioSeleccionado = usuarioSeleccionado
    ? [usuarioSeleccionado.nombre, usuarioSeleccionado.apellido].filter(Boolean).join(' ') ||
      usuarioSeleccionado.email ||
      'este usuario'
    : 'este usuario';

  return (
    <div
      className="dashboard-app-layout usuarios-list-bg"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="usuarios-page-card">
          <header className="usuarios-page-header">
            <div>
              <h2>Usuarios Registrados</h2>
              <p>Consulta, filtra o gestiona los usuarios del sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/usuarios/nuevo')}
              className="usuarios-btn-primary"
            >
              + Registrar Usuario
            </button>
          </header>

          <div className="usuarios-filter-bar">
            <div className="usuarios-filter-field usuarios-filter-field--grow">
              <label htmlFor="filtro-usuario">Buscar usuario</label>
              <input
                id="filtro-usuario"
                type="text"
                placeholder="Filtrar por nombre, apellido, correo o empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="usuarios-filter-field">
              <label htmlFor="filtro-rol">Rol</label>
              <select
                id="filtro-rol"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {rolesDisponibles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {(busqueda || filtroRol) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroRol('');
                }}
                className="usuarios-btn-clear"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {mensajeExito && <div className="usuarios-success-banner">{mensajeExito}</div>}
          {error && <div className="usuarios-error-banner">{error}</div>}

          {cargando ? (
            <div className="usuarios-empty-state">Cargando usuarios...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="usuarios-empty-state">
              {busqueda || filtroRol
                ? 'No se encontraron usuarios que coincidan con los filtros.'
                : 'No hay usuarios registrados aún.'}
            </div>
          ) : (
            <div className="usuarios-table-wrapper">
              <table className="usuarios-data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo Electrónico</th>
                    <th>Rol</th>
                    <th>Empresa Asociada</th>
                    <th className="usuarios-th-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usr, index) => {
                    const id = getUsuarioId(usr);
                    const nombreCompleto =
                      [usr.nombre, usr.apellido].filter(Boolean).join(' ') || 'Sin nombre';
                    const empresa = usr.empresa_nombre || usr.razon_social || '—';

                    return (
                      <tr key={id ?? index}>
                        <td className="usuarios-cell-strong">{nombreCompleto}</td>
                        <td>{usr.email || '—'}</td>
                        <td>
                          <span className="usuarios-role-pill">{usr.rol || 'Sin rol'}</span>
                        </td>
                        <td>{empresa}</td>
                        <td className="usuarios-td-acciones">
                          <button
                            type="button"
                            onClick={() => abrirModal(usr)}
                            className="usuarios-btn-detalle"
                            disabled={!id}
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <DetalleEdicionModal
        isOpen={Boolean(usuarioSeleccionado)}
        titulo="Detalle / Editar Usuario"
        campos={camposUsuario}
        mensajeConfirmacionEliminar={`¿Deseas eliminar al usuario "${etiquetaUsuarioSeleccionado}"? Esta acción no se puede deshacer.`}
        onClose={cerrarModal}
        onGuardar={handleGuardar}
        onEliminar={handleEliminar}
        guardando={guardando}
        eliminando={eliminando}
        errorMensaje={errorModal}
      />
    </div>
  );
}
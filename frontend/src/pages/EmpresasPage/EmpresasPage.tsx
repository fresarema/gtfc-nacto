import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import DetalleEdicionModal, {
  type CampoFormularioModal,
} from '../../components/DetalleEdicionModal/DetalleEdicionModal';
import './EmpresasPage.css';
import fondo from '../../assets/whiteBG.png';

interface Empresa {
  id_empresa?: number;
  id?: number;
  razon_social?: string;
  nombre?: string;
  rut_empresa?: string;
  rut?: string;
  direccion_comercial?: string;
  direccion_base_nacimiento?: string;
  nombre_admin_contrato?: string;
  email_admin_contrato?: string;
  telefono_admin_contrato?: string;
  nombre_supervisor?: string;
  email_supervisor?: string;
  telefono_supervisor?: string;
  telefono?: string;
  correo?: string;
  email?: string;
  direccion?: string;
}

function getEmpresaId(emp: Empresa): number | undefined {
  return emp.id_empresa ?? emp.id;
}

export default function EmpresasPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const cargarEmpresas = useCallback(async (signal?: { cancelled: boolean }) => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/empresas/', { headers: getAuthHeaders() });
      if (signal?.cancelled) return;

      const lista: Empresa[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
      setEmpresas(lista);
    } catch (err) {
      if (signal?.cancelled) return;
      console.error('Error al cargar empresas:', err);
      setError('No se pudieron cargar las empresas registradas.');
    } finally {
      if (!signal?.cancelled) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const state = { cancelled: false };
    cargarEmpresas(state);
    return () => {
      state.cancelled = true;
    };
  }, [cargarEmpresas]);

  const empresasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return empresas;

    return empresas.filter((emp) => {
      const nombre = (emp.razon_social || emp.nombre || '').toLowerCase();
      const rut = (emp.rut_empresa || emp.rut || '').toLowerCase();
      const contacto = (
        emp.email_admin_contrato ||
        emp.correo ||
        emp.email ||
        emp.direccion_comercial ||
        emp.direccion ||
        ''
      ).toLowerCase();
      return nombre.includes(termino) || rut.includes(termino) || contacto.includes(termino);
    });
  }, [empresas, busqueda]);

  const camposEmpresa: CampoFormularioModal[] = useMemo(() => {
    if (!empresaSeleccionada) return [];
    return [
      {
        name: 'razon_social',
        label: 'Razón social',
        type: 'text',
        value: empresaSeleccionada.razon_social || empresaSeleccionada.nombre || '',
        required: true,
      },
      {
        name: 'rut_empresa',
        label: 'RUT',
        type: 'text',
        value: empresaSeleccionada.rut_empresa || empresaSeleccionada.rut || '',
        required: true,
      },
      {
        name: 'telefono_admin_contrato',
        label: 'Teléfono contacto',
        type: 'text',
        value:
          empresaSeleccionada.telefono_admin_contrato ||
          empresaSeleccionada.telefono ||
          '',
      },
      {
        name: 'email_admin_contrato',
        label: 'Correo contacto',
        type: 'email',
        value:
          empresaSeleccionada.email_admin_contrato ||
          empresaSeleccionada.correo ||
          empresaSeleccionada.email ||
          '',
      },
      {
        name: 'direccion_comercial',
        label: 'Dirección comercial',
        type: 'text',
        value:
          empresaSeleccionada.direccion_comercial ||
          empresaSeleccionada.direccion ||
          '',
      },
    ];
  }, [empresaSeleccionada]);

  const abrirModal = (emp: Empresa) => {
    setMensajeExito('');
    setError('');
    setErrorModal('');
    setEmpresaSeleccionada(emp);
  };

  const cerrarModal = () => {
    if (guardando || eliminando) return;
    setEmpresaSeleccionada(null);
    setErrorModal('');
  };

  const handleGuardar = async (valores: Record<string, string>) => {
    if (!empresaSeleccionada) return;
    const id = getEmpresaId(empresaSeleccionada);
    if (!id) return;

    const razonSocial = (valores.razon_social || '').trim();
    const rut = (valores.rut_empresa || '').trim();

    if (!razonSocial || !rut) {
      setErrorModal('La razón social y el RUT son obligatorios.');
      return;
    }

    setGuardando(true);
    setErrorModal('');

    try {
      const payload = {
        razon_social: razonSocial,
        rut_empresa: rut,
        telefono_admin_contrato: (valores.telefono_admin_contrato || '').trim() || null,
        email_admin_contrato: (valores.email_admin_contrato || '').trim() || null,
        direccion_comercial: (valores.direccion_comercial || '').trim() || null,
      };

      const res = await api.patch(`/empresas/${id}/`, payload, {
        headers: getAuthHeaders(),
      });

      const actualizada: Empresa = res.data?.empresa ?? {
        ...empresaSeleccionada,
        ...payload,
      };

      setEmpresas((prev) =>
        prev.map((item) => (getEmpresaId(item) === id ? { ...item, ...actualizada } : item))
      );
      setMensajeExito('Empresa actualizada correctamente.');
      setEmpresaSeleccionada(null);
    } catch (err: unknown) {
      const respError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErrorModal(respError || 'No se pudo actualizar la empresa.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!empresaSeleccionada) return;
    const id = getEmpresaId(empresaSeleccionada);
    if (!id) return;

    const nombreEtiqueta =
      empresaSeleccionada.razon_social || empresaSeleccionada.nombre || `ID ${id}`;

    setEliminando(true);
    setErrorModal('');

    try {
      await api.delete(`/empresas/${id}/`, { headers: getAuthHeaders() });
      setEmpresas((prev) => prev.filter((item) => getEmpresaId(item) !== id));
      setMensajeExito(`Empresa "${nombreEtiqueta}" eliminada.`);
      setEmpresaSeleccionada(null);
    } catch (err: unknown) {
      const respError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErrorModal(respError || 'No se pudo eliminar la empresa.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div
      className="dashboard-app-layout empresas-list-bg"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <Navbar />

      <main className="dashboard-main-content">
        <div className="list-page-card">
          <header className="list-page-header">
            <div>
              <h2>Empresas Registradas</h2>
              <p>Consulta, filtra o gestiona las empresas asociadas al sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/empresas/nueva')}
              className="btn-primary-action"
            >
              + Registrar Empresa
            </button>
          </header>

          <div className="list-filter-bar">
            <div className="filter-field filter-field--grow">
              <label htmlFor="filtro-empresa">Buscar empresa</label>
              <input
                id="filtro-empresa"
                type="text"
                placeholder="Filtrar por razón social, RUT, correo o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="btn-clear-filter"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          {mensajeExito && <div className="list-success-banner">{mensajeExito}</div>}
          {error && <div className="list-error-banner">{error}</div>}

          {cargando ? (
            <div className="list-empty-state">Cargando empresas...</div>
          ) : empresasFiltradas.length === 0 ? (
            <div className="list-empty-state">
              {busqueda
                ? 'No se encontraron empresas que coincidan con el filtro.'
                : 'No hay empresas registradas aún.'}
            </div>
          ) : (
            <div className="list-table-wrapper">
              <table className="data-list-table">
                <thead>
                  <tr>
                    <th>Razón Social / Nombre</th>
                    <th>RUT</th>
                    <th>Contacto</th>
                    <th>Dirección</th>
                    <th className="th-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresasFiltradas.map((emp, index) => {
                    const id = getEmpresaId(emp);
                    const nombre = emp.razon_social || emp.nombre || 'Sin nombre';
                    const rut = emp.rut_empresa || emp.rut || '—';
                    const contacto =
                      emp.email_admin_contrato ||
                      emp.correo ||
                      emp.email ||
                      emp.telefono_admin_contrato ||
                      emp.telefono ||
                      '—';
                    const direccion = emp.direccion_comercial || emp.direccion || '—';

                    return (
                      <tr key={id ?? index}>
                        <td className="cell-strong">{nombre}</td>
                        <td>{rut}</td>
                        <td>{contacto}</td>
                        <td>{direccion}</td>
                        <td className="td-acciones">
                          <button
                            type="button"
                            onClick={() => abrirModal(emp)}
                            className="btn-row-detalle"
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
        isOpen={Boolean(empresaSeleccionada)}
        titulo="Detalle / Editar Empresa"
        campos={camposEmpresa}
        mensajeConfirmacionEliminar={`¿Deseas eliminar la empresa "${empresaSeleccionada?.razon_social || empresaSeleccionada?.nombre || ''}"? Esta acción no se puede deshacer.`}
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
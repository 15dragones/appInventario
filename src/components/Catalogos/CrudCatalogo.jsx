import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api.js'
import { getApiErrorMessage } from '../../services/errors.js'
import { useAuth } from '../../context/useAuth.js'
import { AlertTriangle, Trash2 } from 'lucide-react'

const catalogos = {
  categorias: {
    titulo: 'Categorías',
    singular: 'categoría',
    ruta: '/categorias',
    countProducts: true,
    campos: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    ],
  },
  proveedores: {
    titulo: 'Proveedores',
    singular: 'proveedor',
    ruta: '/proveedores',
    campos: [
      { name: 'razonSocial', label: 'Razón social', required: true },
      { name: 'contacto', label: 'Persona de contacto' },
      { name: 'telefono', label: 'Teléfono', type: 'tel' },
      { name: 'email', label: 'Correo electrónico', type: 'email' },
    ],
  },
}

function getEmptyForm(config) {
  return Object.fromEntries(config.campos.map(({ name }) => [name, '']))
}

function CrudCatalogo({ tipo }) {
  const config = catalogos[tipo]
  const { user } = useAuth()
  const canManage = user?.rol === 'Administrador'
  const extraColumnCount = config.countProducts ? 1 : 0
  const actionColumnCount = canManage ? 1 : 0
  const [registros, setRegistros] = useState([])
  const [form, setForm] = useState(() => getEmptyForm(config))
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const cargarRegistros = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get(config.ruta)
      setRegistros(data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [config.ruta])

  useEffect(() => {
    let active = true
    api.get(config.ruta)
      .then(({ data }) => {
        if (active) {
          setRegistros(data)
          setErrorMessage('')
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(getApiErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [config.ruta])

  function limpiarFormulario() {
    setForm(getEmptyForm(config))
    setEditingId(null)
    setIsFormOpen(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    try {
      if (editingId) {
        await api.put(`${config.ruta}/${editingId}`, form)
      } else {
        await api.post(config.ruta, form)
      }
      limpiarFormulario()
      await cargarRegistros()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!recordToDelete) return

    const registro = recordToDelete
    setDeletingId(registro.id)
    setErrorMessage('')
    try {
      await api.delete(`${config.ruta}/${registro.id}`)
      if (editingId === registro.id) {
        limpiarFormulario()
      }
      setRecordToDelete(null)
      await cargarRegistros()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  function iniciarEdicion(registro) {
    setEditingId(registro.id)
    setForm(Object.fromEntries(
      config.campos.map(({ name }) => [name, registro[name] || '']),
    ))
    setErrorMessage('')
    setIsFormOpen(true)
  }

  const filteredRecords = registros.filter((registro) => (
    config.campos.map(({ name }) => registro[name] || '').join(' ')
      .toLocaleLowerCase('es')
      .includes(search.trim().toLocaleLowerCase('es'))
  ))

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="page-eyebrow">Catálogo</p>
        <h1 className="page-title">{config.titulo}</h1>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert" aria-live="polite">
          {errorMessage}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={cargarRegistros}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="page-toolbar">
        <input
          className="form-control table-search"
          type="search"
          aria-label={`Buscar ${config.titulo.toLocaleLowerCase('es')}`}
          placeholder={`Buscar por ${tipo === 'categorias' ? 'nombre' : 'razón social o contacto'}...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {canManage && (
          <button
            className="btn btn-primary toolbar-primary"
            type="button"
            onClick={() => {
              limpiarFormulario()
              setIsFormOpen(true)
            }}
          >
            + {tipo === 'categorias' ? 'Nueva categoría' : 'Nuevo proveedor'}
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) limpiarFormulario()
        }}>
          <section className="modal-card-custom" role="dialog" aria-modal="true" aria-labelledby="catalog-form-title">
            <div className="product-card-heading modal-heading">
              <div>
                <h2 id="catalog-form-title">{editingId ? `Editar ${config.singular}` : tipo === 'categorias' ? 'Nueva categoría' : 'Nuevo proveedor'}</h2>
                <p>Completa la información del catálogo.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Cerrar" onClick={limpiarFormulario}>×</button>
            </div>
            <form className="product-form-body" onSubmit={handleSubmit}>
              {config.campos.map((campo) => (
                <div className="mb-3" key={campo.name}>
                  <label className="form-label" htmlFor={campo.name}>{campo.label}</label>
                  {campo.type === 'textarea' ? (
                    <textarea
                      id={campo.name}
                      className="form-control"
                      name={campo.name}
                      value={form[campo.name]}
                      onChange={handleChange}
                      rows="3"
                    />
                  ) : (
                    <input
                      id={campo.name}
                      className="form-control"
                      type={campo.type || 'text'}
                      name={campo.name}
                      value={form[campo.name]}
                      onChange={handleChange}
                      required={campo.required}
                    />
                  )}
                </div>
              ))}
              <button
                className="btn btn-primary product-submit-button w-100"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar'}
              </button>
              {editingId && (
                <button
                  className="btn btn-link text-secondary w-100 mt-2 text-decoration-none"
                  type="button"
                  onClick={limpiarFormulario}
                  disabled={isSaving}
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </section>
        </div>
      )}

      <section aria-labelledby="catalog-list-title">
          <div className="product-card product-list-card">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="catalog-list-title">Lista de {config.titulo.toLowerCase()}</h2>
                <p>Registros disponibles en el inventario.</p>
              </div>
              <span className="product-count">
                {filteredRecords.length} {filteredRecords.length === 1 ? config.singular : config.titulo.toLocaleLowerCase('es')}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {config.campos.map((campo) => <th key={campo.name}>{campo.label}</th>)}
                    {config.countProducts && <th>Productos</th>}
                    {canManage && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 1 + extraColumnCount + actionColumnCount}>Cargando…</td></tr>
                  ) : errorMessage ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 1 + extraColumnCount + actionColumnCount}>No se pudo cargar la información.</td></tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 1 + extraColumnCount + actionColumnCount}>
                      {search ? 'No hay registros que coincidan con la búsqueda.' : 'Aún no hay registros.'}
                    </td></tr>
                  ) : filteredRecords.map((registro) => (
                    <tr key={registro.id}>
                      <td>{registro.id}</td>
                      {config.campos.map((campo) => (
                        <td key={campo.name}>
                          {registro[campo.name] || '—'}
                        </td>
                      ))}
                      {config.countProducts && <td>{registro.productos?.length ?? 0}</td>}
                      {canManage && (
                        <td>
                          <div className="product-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => iniciarEdicion(registro)}
                              disabled={deletingId === registro.id}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              type="button"
                              onClick={() => setRecordToDelete(registro)}
                              disabled={deletingId === registro.id}
                            >
                              {deletingId === registro.id ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      {recordToDelete && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="delete-catalog-title">
            <div className="modal-dialog modal-dialog-centered">
              <section className="modal-content border-0 shadow">
                <div className="modal-header border-0 pb-0">
                  <span className="delete-confirmation-icon" aria-hidden="true">
                    <AlertTriangle size={21} />
                  </span>
                  <button
                    className="btn-close ms-auto"
                    type="button"
                    aria-label="Cerrar"
                    onClick={() => setRecordToDelete(null)}
                    disabled={deletingId !== null}
                  />
                </div>
                <div className="modal-body pt-2 text-center">
                  <h2 className="modal-title fs-5 mb-2" id="delete-catalog-title">
                    ¿Eliminar {config.singular}?
                  </h2>
                  <p className="text-secondary mb-0">
                    Se eliminará <strong>{recordToDelete.nombre || recordToDelete.razonSocial}</strong>.
                    Esta acción no se puede deshacer.
                  </p>
                  {errorMessage && (
                    <div className="alert alert-danger py-2 mt-3 mb-0 text-start" role="alert">
                      {errorMessage}
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0 pt-2">
                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={() => setRecordToDelete(null)}
                    disabled={deletingId !== null}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-danger d-inline-flex align-items-center gap-2"
                    type="button"
                    onClick={handleDelete}
                    disabled={deletingId !== null}
                  >
                    <Trash2 size={16} />
                    {deletingId === recordToDelete.id ? 'Eliminando…' : 'Sí, eliminar'}
                  </button>
                </div>
              </section>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => {
              if (deletingId === null) setRecordToDelete(null)
            }}
          />
        </>
      )}
    </div>
  )
}

export default CrudCatalogo

import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api.js'
import { getApiErrorMessage } from '../../services/errors.js'

const catalogos = {
  categorias: {
    titulo: 'Categorías',
    singular: 'categoría',
    ruta: '/categorias',
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
  const [registros, setRegistros] = useState([])
  const [form, setForm] = useState(() => getEmptyForm(config))
  const [editingId, setEditingId] = useState(null)
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

  async function handleDelete(registro) {
    const nombre = registro.nombre || registro.razonSocial
    if (!window.confirm(`¿Eliminar ${config.singular} "${nombre}"?`)) {
      return
    }
    setDeletingId(registro.id)
    setErrorMessage('')
    try {
      await api.delete(`${config.ruta}/${registro.id}`)
      if (editingId === registro.id) {
        limpiarFormulario()
      }
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
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="page-eyebrow">Catálogo</p>
        <h1 className="page-title">{config.titulo}</h1>
        <p className="page-subtitle">
          Administra los datos que organizan y abastecen tus productos.
        </p>
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

      <div className="row g-4">
        <section className="col-12 col-lg-4" aria-labelledby="catalog-form-title">
          <div className="product-card">
            <div className="product-card-heading">
              <h2 id="catalog-form-title">
                {editingId ? `Editar ${config.singular}` : `Nueva ${config.singular}`}
              </h2>
              <p>Completa la información del catálogo.</p>
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
          </div>
        </section>

        <section className="col-12 col-lg-8" aria-labelledby="catalog-list-title">
          <div className="product-card product-list-card">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="catalog-list-title">Lista de {config.titulo.toLowerCase()}</h2>
                <p>Registros disponibles en el inventario.</p>
              </div>
              <span className="product-count">{registros.length} registros</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {config.campos.map((campo) => <th key={campo.name}>{campo.label}</th>)}
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 2}>Cargando…</td></tr>
                  ) : errorMessage ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 2}>No se pudo cargar la información.</td></tr>
                  ) : registros.length === 0 ? (
                    <tr><td className="product-empty-state" colSpan={config.campos.length + 2}>Aún no hay registros.</td></tr>
                  ) : registros.map((registro) => (
                    <tr key={registro.id}>
                      <td>{registro.id}</td>
                      {config.campos.map((campo) => (
                        <td key={campo.name}>
                          {registro[campo.name] || '—'}
                        </td>
                      ))}
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
                            onClick={() => handleDelete(registro)}
                            disabled={deletingId === registro.id}
                          >
                            {deletingId === registro.id ? 'Eliminando…' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CrudCatalogo

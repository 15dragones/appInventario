import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

const emptyForm = {
  nombre: '',
  email: '',
  rol: 'Almacenero',
  password: '',
  activo: true,
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [changingId, setChangingId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const cargarUsuarios = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/usuarios')
      setUsuarios(data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    api.get('/usuarios')
      .then(({ data }) => {
        if (active) {
          setUsuarios(data)
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
  }, [])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    if (!query) return usuarios
    return usuarios.filter((user) => `${user.nombre} ${user.email} ${user.rol}`.toLocaleLowerCase('es').includes(query))
  }, [search, usuarios])

  function closeModal() {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(emptyForm)
    setErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(user) {
    setEditingId(user.id)
    setForm({
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      password: '',
      activo: user.activo,
    })
    setErrorMessage('')
    setIsModalOpen(true)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    const user = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      rol: form.rol,
      activo: form.activo,
      ...(form.password ? { password: form.password } : {}),
    }
    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, user)
      } else {
        await api.post('/usuarios', user)
      }
      closeModal()
      await cargarUsuarios()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActive(user) {
    setChangingId(user.id)
    setErrorMessage('')
    try {
      await api.put(`/usuarios/${user.id}`, {
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        activo: !user.activo,
      })
      await cargarUsuarios()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setChangingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="page-eyebrow">Administración</p>
        <h1 className="page-title">Usuarios</h1>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert" aria-live="polite">
          {errorMessage}
          {!isModalOpen && (
            <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={cargarUsuarios}>
              Reintentar
            </button>
          )}
        </div>
      )}

      <div className="page-toolbar">
        <input
          className="form-control table-search"
          type="search"
          aria-label="Buscar usuarios"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-primary toolbar-primary" type="button" onClick={openCreateModal}>
          + Nuevo usuario
        </button>
      </div>

      <section className="product-card product-list-card" aria-labelledby="users-list-title">
        <div className="product-card-heading product-list-heading">
          <div>
            <h2 id="users-list-title">Lista de usuarios</h2>
            <p>Usuarios con acceso al panel administrativo.</p>
          </div>
          <span className="product-count">{filteredUsers.length} usuarios</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover product-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="product-empty-state" colSpan="6">Cargando usuarios…</td></tr>
              ) : errorMessage && !usuarios.length ? (
                <tr><td className="product-empty-state" colSpan="6">No se pudo cargar la información.</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td className="product-empty-state" colSpan="6">
                  {search ? 'No hay usuarios que coincidan con la búsqueda.' : 'Aún no hay usuarios registrados.'}
                </td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{String(user.id).padStart(3, '0')}</td>
                  <td className="product-name">{user.nombre}</td>
                  <td>{user.email}</td>
                  <td>{user.rol}</td>
                  <td>
                    <span className={`status-badge ${user.activo ? 'status-active' : 'status-inactive'}`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="product-actions">
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => openEditModal(user)}>
                        Editar
                      </button>
                      <button
                        className={`btn btn-sm ${user.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        type="button"
                        disabled={changingId === user.id}
                        onClick={() => toggleActive(user)}
                      >
                        {changingId === user.id ? 'Guardando…' : user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Mostrando {filteredUsers.length} de {usuarios.length} usuarios</span>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) closeModal()
        }}>
          <section className="modal-card-custom" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
            <div className="product-card-heading modal-heading">
              <div>
                <h2 id="user-form-title">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <p>Completa los datos de acceso del usuario.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Cerrar" onClick={closeModal}>×</button>
            </div>
            <form className="product-form-body" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-name">Nombre</label>
                <input id="user-name" className="form-control" name="nombre" value={form.nombre} onChange={handleChange} maxLength="120" required />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-email">Email</label>
                <input id="user-email" className="form-control" name="email" type="email" value={form.email} onChange={handleChange} maxLength="180" required />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-role">Rol</label>
                <select id="user-role" className="form-select" name="rol" value={form.rol} onChange={handleChange}>
                  <option value="Administrador">Administrador</option>
                  <option value="Almacenero">Almacenero</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-password">{editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                <input id="user-password" className="form-control" name="password" type="password" value={form.password} onChange={handleChange} minLength="8" maxLength="72" required={!editingId} autoComplete="new-password" />
                <small className="form-text">Mínimo 8 caracteres. Se almacena con bcrypt en el servidor.</small>
              </div>
              {editingId && (
                <div className="form-check mb-3">
                  <input id="user-active" className="form-check-input" name="activo" type="checkbox" checked={form.activo} onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))} />
                  <label className="form-check-label" htmlFor="user-active">Usuario activo</label>
                </div>
              )}
              {isModalOpen && errorMessage && (
                <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>
              )}
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-light" type="button" onClick={closeModal} disabled={isSaving}>Cancelar</button>
                <button className="btn btn-primary product-submit-button px-4" type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Usuarios

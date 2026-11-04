import { useEffect, useState } from 'react'
import { Building2, CircleUserRound, Bell, SlidersHorizontal, X } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

const emptyBusiness = {
  nombreComercial: '',
  ruc: '',
  direccion: '',
  telefono: '',
  email: '',
}

const sections = [
  { id: 'profile', label: 'Mi perfil', icon: CircleUserRound },
  { id: 'business', label: 'Mi negocio', icon: Building2 },
  { id: 'preferences', label: 'Preferencias', icon: SlidersHorizontal },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
]

function AccountSettings({ section, onSectionChange, onClose, preferences, onPreferencesChange }) {
  const { user, updateProfile } = useAuth()
  const [profile, setProfile] = useState({ nombre: user.nombre, email: user.email })
  const [business, setBusiness] = useState(emptyBusiness)
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const isAdministrator = user.rol === 'Administrador'

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  useEffect(() => {
    if (section !== 'business') return undefined

    const controller = new AbortController()
    Promise.resolve()
      .then(() => {
        if (!controller.signal.aborted) {
          setIsLoadingBusiness(true)
          setErrorMessage('')
        }
        return api.get('/negocio', { signal: controller.signal })
      })
      .then(({ data }) => {
        setBusiness({
          nombreComercial: data.nombreComercial || '',
          ruc: data.ruc || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          email: data.email || '',
        })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErrorMessage(getApiErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingBusiness(false)
      })
    return () => controller.abort()
  }, [section])

  function changeProfile(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  function changeBusiness(event) {
    const { name, value } = event.target
    setBusiness((current) => ({ ...current, [name]: value }))
    setErrorMessage('')
    setSuccessMessage('')
  }

  async function saveProfile(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await updateProfile({
        nombre: profile.nombre.trim(),
        email: profile.email.trim(),
      })
      setSuccessMessage('Tu perfil se actualizó correctamente.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function saveBusiness(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const { data } = await api.put('/negocio', {
        nombreComercial: business.nombreComercial.trim(),
        ruc: business.ruc.trim(),
        direccion: business.direccion.trim(),
        telefono: business.telefono.trim(),
        email: business.email.trim(),
      })
      setBusiness({
        nombreComercial: data.nombreComercial || '',
        ruc: data.ruc || '',
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
      })
      setSuccessMessage('Los datos del negocio se guardaron para todos los usuarios.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function updatePreference(name, value) {
    onPreferencesChange({ ...preferences, [name]: value })
  }

  return (
    <div className="settings-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose()
    }}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-heading">
            <span className="settings-brand-mark"><CircleUserRound size={19} /></span>
            <div>
              <strong>Cuenta y ajustes</strong>
              <small>Administra tu espacio</small>
            </div>
          </div>
          <nav className="settings-nav" aria-label="Secciones de configuración">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={`settings-nav-link${section === id ? ' active' : ''}`}
                aria-current={section === id ? 'page' : undefined}
                onClick={() => {
                  onSectionChange(id)
                  setErrorMessage('')
                  setSuccessMessage('')
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>
          <div className="settings-user-summary">
            <span className="settings-user-avatar">{user.nombre.charAt(0).toLocaleUpperCase('es')}</span>
            <span><strong>{user.nombre}</strong><small>{user.rol}</small></span>
          </div>
        </aside>

        <div className="settings-main">
          <header className="settings-header">
            <div>
              <span className="settings-eyebrow">CONFIGURACIÓN</span>
              <h2 id="settings-title">{sections.find((item) => item.id === section)?.label}</h2>
            </div>
            <button type="button" className="settings-close" onClick={onClose} aria-label="Cerrar ajustes">
              <X size={18} />
            </button>
          </header>

          <div className="settings-content">
            {errorMessage && <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>}
            {successMessage && <div className="alert alert-success py-2" role="status">{successMessage}</div>}

            {section === 'profile' && (
              <form className="settings-form" onSubmit={saveProfile}>
                <div className="settings-intro">
                  <h3>Información de tu cuenta</h3>
                  <p>Estos datos identifican tu acceso al sistema.</p>
                </div>
                <label className="settings-field">
                  Nombre completo
                  <input
                    className="form-control"
                    name="nombre"
                    autoComplete="name"
                    maxLength="120"
                    value={profile.nombre}
                    onChange={changeProfile}
                    required
                  />
                </label>
                <label className="settings-field">
                  Correo electrónico
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength="180"
                    value={profile.email}
                    onChange={changeProfile}
                    required
                  />
                </label>
                <div className="settings-readonly">
                  <span>Rol de acceso</span>
                  <strong>{user.rol}</strong>
                  <small>El rol lo administra un administrador del sistema.</small>
                </div>
                <button className="settings-save" type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando…' : 'Guardar perfil'}
                </button>
              </form>
            )}

            {section === 'business' && (
              isLoadingBusiness ? (
                <div className="settings-loading" role="status">Cargando datos del negocio…</div>
              ) : (
                <form className="settings-form" onSubmit={saveBusiness}>
                  <div className="settings-intro">
                    <h3>Datos del negocio</h3>
                    <p>La información se guarda en MySQL y es compartida con los usuarios del sistema.</p>
                  </div>
                  <label className="settings-field">
                    Nombre comercial
                    <input className="form-control" name="nombreComercial" maxLength="120" value={business.nombreComercial} onChange={changeBusiness} required disabled={!isAdministrator} />
                  </label>
                  <label className="settings-field">
                    RUC <span className="settings-optional">Opcional · 11 dígitos</span>
                    <input className="form-control" name="ruc" inputMode="numeric" pattern="[0-9]{11}" maxLength="11" value={business.ruc} onChange={changeBusiness} disabled={!isAdministrator} />
                  </label>
                  <label className="settings-field">
                    Dirección
                    <input className="form-control" name="direccion" autoComplete="street-address" maxLength="255" value={business.direccion} onChange={changeBusiness} disabled={!isAdministrator} />
                  </label>
                  <div className="settings-field-row">
                    <label className="settings-field">
                      Teléfono
                      <input className="form-control" name="telefono" type="tel" autoComplete="tel" maxLength="40" value={business.telefono} onChange={changeBusiness} disabled={!isAdministrator} />
                    </label>
                    <label className="settings-field">
                      Correo del negocio
                      <input className="form-control" name="email" type="email" autoComplete="email" maxLength="180" value={business.email} onChange={changeBusiness} disabled={!isAdministrator} />
                    </label>
                  </div>
                  {isAdministrator ? (
                    <button className="settings-save" type="submit" disabled={isSaving}>
                      {isSaving ? 'Guardando…' : 'Guardar datos del negocio'}
                    </button>
                  ) : (
                    <p className="settings-permission-note">Solo un administrador puede editar los datos del negocio.</p>
                  )}
                </form>
              )
            )}

            {section === 'preferences' && (
              <div className="settings-form">
                <div className="settings-intro">
                  <h3>Preferencias de visualización</h3>
                  <p>Se guardan en este navegador para personalizar tu espacio.</p>
                </div>
                <label className="settings-toggle-row">
                  <span><strong>Vista compacta</strong><small>Reduce el espacio de las tablas para ver más filas.</small></span>
                  <input
                    type="checkbox"
                    checked={preferences.compactView}
                    onChange={(event) => updatePreference('compactView', event.target.checked)}
                  />
                </label>
                <div className="settings-readonly">
                  <span>Idioma</span>
                  <strong>Español</strong>
                  <small>El idioma actual del sistema.</small>
                </div>
              </div>
            )}

            {section === 'notifications' && (
              <div className="settings-form">
                <div className="settings-intro">
                  <h3>Avisos de inventario</h3>
                  <p>Consulta las alertas de stock desde la campana del encabezado.</p>
                </div>
                <label className="settings-toggle-row">
                  <span><strong>Productos con poco stock</strong><small>Mostrar el contador y la lista de productos con cinco unidades o menos.</small></span>
                  <input
                    type="checkbox"
                    checked={preferences.lowStockNotifications}
                    onChange={(event) => updatePreference('lowStockNotifications', event.target.checked)}
                  />
                </label>
                <p className="settings-permission-note">Los avisos se actualizan con las existencias registradas en el sistema.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AccountSettings

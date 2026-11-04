import { useEffect, useRef, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Building2, ChevronDown, CircleUserRound, LogOut, Settings, UserRound } from 'lucide-react'
import CrudProductos from './components/Productos/CrudProductos.jsx'
import CrudCatalogo from './components/Catalogos/CrudCatalogo.jsx'
import Dashboard from './components/Dashboard.jsx'
import Kardex from './components/Kardex.jsx'
import Usuarios from './components/Usuarios.jsx'
import Autenticacion from './components/Autenticacion.jsx'
import AccountSettings from './components/AccountSettings.jsx'
import { useAuth } from './context/useAuth.js'
import api from './services/api.js'
import { getApiErrorMessage } from './services/errors.js'
import './App.css'

const navigation = [
  { to: '/', label: 'Inicio (Dashboard)', icon: 'home', end: true },
  { to: '/productos', label: 'Productos', icon: 'box' },
  { to: '/categorias', label: 'Categorías', icon: 'grid' },
  { to: '/proveedores', label: 'Proveedores', icon: 'users' },
  { to: '/kardex', label: 'Kardex / Movimientos', icon: 'arrows' },
  { to: '/usuarios', label: 'Usuarios', icon: 'user' },
]

const iconPaths = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
  box: <><path d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z" /><path d="m3.3 7.7 8.7 4.5 8.7-4.5M12 12.2V21" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  arrows: <><path d="M7 7h14l-3-3M17 17H3l3 3" /><path d="M21 7 17 11M3 17l4-4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
}

function Icon({ name }) {
  return (
    <svg aria-hidden="true" className="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  )
}

function App() {
  const { user, isLoading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsSection, setSettingsSection] = useState(null)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [lowStockCount, setLowStockCount] = useState(0)
  const [notificationError, setNotificationError] = useState('')
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [preferences, setPreferences] = useState(() => ({
    compactView: localStorage.getItem('inventory:compact-view') === 'true',
    lowStockNotifications: localStorage.getItem('inventory:low-stock-notifications') !== 'false',
  }))
  const accountMenuRef = useRef(null)
  const notificationsRef = useRef(null)
  const userId = user?.id

  useEffect(() => {
    localStorage.setItem('inventory:compact-view', String(preferences.compactView))
    localStorage.setItem('inventory:low-stock-notifications', String(preferences.lowStockNotifications))
  }, [preferences])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false)
      if (!notificationsRef.current?.contains(event.target)) setIsNotificationsOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
        setIsNotificationsOpen(false)
        setSettingsSection(null)
      }
    }
    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!userId) return undefined

    let active = true
    Promise.resolve()
      .then(() => {
        if (active) {
          setIsLoadingNotifications(true)
          setNotificationError('')
        }
        return api.get('/dashboard/resumen')
      })
      .then(({ data }) => {
        if (active) {
          setLowStockProducts(data.productosBajoStockLista)
          setLowStockCount(data.productosBajoStock)
        }
      })
      .catch((error) => {
        if (active) setNotificationError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoadingNotifications(false)
      })
    return () => {
      active = false
    }
  }, [userId, isNotificationsOpen])

  function updatePreferences(nextPreferences) {
    setPreferences(nextPreferences)
  }

  function openSettings(section) {
    setIsAccountMenuOpen(false)
    setSettingsSection(section)
  }

  function handleSwitchUser() {
    setIsAccountMenuOpen(false)
    setIsNotificationsOpen(false)
    signOut()
    navigate('/login', { replace: true })
  }

  if (isLoading) {
    return <main className="auth-page"><p role="status">Verificando sesión…</p></main>
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/register" element={<Autenticacion registro />} />
        <Route path="*" element={<Autenticacion />} />
      </Routes>
    )
  }

  const esAdministrador = user.rol === 'Administrador'
  if (location.pathname === '/login' || location.pathname === '/register') {
    return <Navigate to="/" replace />
  }

  return (
    <div className={`app-shell${preferences.compactView ? ' compact-view' : ''}`}>
      <header className="app-header">
        <div className="app-header-content">
          <div className="header-search-hint">Panel de administración de inventario</div>
          <div className="header-account">
            <div className="header-popover-anchor" ref={notificationsRef}>
              <button
                type="button"
                className={`header-icon-button${isNotificationsOpen ? ' is-open' : ''}`}
                aria-label="Notificaciones"
                aria-expanded={isNotificationsOpen}
                onClick={() => {
                  setIsNotificationsOpen((current) => !current)
                  setIsAccountMenuOpen(false)
                }}
              >
                <Bell size={18} />
                {preferences.lowStockNotifications && lowStockCount > 0 && (
                  <span className="notification-count">
                    {lowStockCount > 9 ? '9+' : lowStockCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <section className="notification-popover" aria-label="Alertas de inventario">
                  <div className="popover-heading">
                    <span><strong>Notificaciones</strong><small>Alertas de inventario</small></span>
                    <button type="button" onClick={() => openSettings('notifications')}>Ajustes</button>
                  </div>
                  {!preferences.lowStockNotifications ? (
                    <p className="popover-empty">Los avisos de stock están desactivados.</p>
                  ) : isLoadingNotifications ? (
                    <p className="popover-empty" role="status">Revisando existencias…</p>
                  ) : notificationError ? (
                    <p className="popover-error" role="alert">{notificationError}</p>
                  ) : lowStockProducts.length === 0 ? (
                    <p className="popover-empty">No hay productos con stock bajo. Todo en orden.</p>
                  ) : (
                    <div className="notification-list">
                      {lowStockProducts.slice(0, 5).map((product) => (
                        <NavLink
                          key={product.id}
                          to="/productos"
                          className="notification-item"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          <span className="notification-item-icon"><Bell size={15} /></span>
                          <span><strong>{product.nombre}</strong><small>{product.categoria?.nombre || 'Sin categoría'}</small></span>
                          <span className="notification-item-stock">{product.stock}</span>
                        </NavLink>
                      ))}
                      {lowStockCount > lowStockProducts.length && (
                        <p className="notification-more">{lowStockCount - lowStockProducts.length} avisos más en productos.</p>
                      )}
                    </div>
                  )}
                  <NavLink to="/productos" className="popover-footer" onClick={() => setIsNotificationsOpen(false)}>
                    Ver inventario <span aria-hidden="true">→</span>
                  </NavLink>
                </section>
              )}
            </div>

            <div className="header-popover-anchor" ref={accountMenuRef}>
              <button
                type="button"
                className={`account-menu-trigger${isAccountMenuOpen ? ' is-open' : ''}`}
                aria-label={`Cuenta de ${user.nombre}`}
                aria-expanded={isAccountMenuOpen}
                onClick={() => {
                  setIsAccountMenuOpen((current) => !current)
                  setIsNotificationsOpen(false)
                }}
              >
                <span className="account-avatar" aria-hidden="true">
                  {user.nombre.charAt(0).toLocaleUpperCase('es')}
                </span>
                <span className="account-trigger-copy">
                  <strong className="account-name">{user.nombre}</strong>
                  <small>{user.rol}</small>
                </span>
                <ChevronDown size={15} className="account-chevron" />
              </button>
              {isAccountMenuOpen && (
                <section className="account-popover" aria-label="Opciones de cuenta">
                  <div className="account-popover-user">
                    <span className="account-avatar">
                      {user.nombre.charAt(0).toLocaleUpperCase('es')}
                    </span>
                    <span><strong>{user.nombre}</strong><small>{user.email}</small><small>{user.rol}</small></span>
                  </div>
                  <div className="account-popover-links">
                    <button type="button" onClick={() => openSettings('profile')}>
                      <UserRound size={16} /> Mi perfil
                    </button>
                    <button type="button" onClick={() => openSettings('business')}>
                      <Building2 size={16} /> Mi negocio
                    </button>
                    <button type="button" onClick={() => openSettings('preferences')}>
                      <Settings size={16} /> Preferencias
                    </button>
                    <button type="button" onClick={() => openSettings('notifications')}>
                      <Bell size={16} /> Notificaciones
                    </button>
                  </div>
                  <div className="account-popover-footer">
                    <button type="button" onClick={handleSwitchUser}>
                      <CircleUserRound size={16} /> Cambiar usuario
                    </button>
                    <button type="button" className="account-signout" onClick={handleSwitchUser}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container-fluid app-layout">
        <aside className="app-sidebar" aria-label="Navegación principal">
          <div className="sidebar-brand">
            <span className="app-brand-mark" aria-hidden="true">S</span>
            <span><strong>SENATI</strong><small>Sistema de Inventario</small></span>
          </div>
          <p className="sidebar-label">MENÚ PRINCIPAL</p>
          <nav className="sidebar-nav">
            {navigation.filter(({ to }) => esAdministrador || to !== '/usuarios').map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note">Panel de control</div>
        </aside>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<CrudProductos />} />
            <Route
              path="/categorias"
              element={<CrudCatalogo tipo="categorias" />}
            />
            <Route
              path="/proveedores"
              element={<CrudCatalogo tipo="proveedores" />}
            />
            <Route path="/kardex" element={<Kardex />} />
            <Route
              path="/usuarios"
              element={esAdministrador ? <Usuarios /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
      {settingsSection && (
        <AccountSettings
          section={settingsSection}
          onSectionChange={setSettingsSection}
          onClose={() => setSettingsSection(null)}
          preferences={preferences}
          onPreferencesChange={updatePreferences}
        />
      )}
    </div>
  )
}

export default App

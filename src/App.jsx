import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import CrudProductos from './components/Productos/CrudProductos.jsx'
import CrudCatalogo from './components/Catalogos/CrudCatalogo.jsx'
import Dashboard from './components/Dashboard.jsx'
import Kardex from './components/Kardex.jsx'
import Usuarios from './components/Usuarios.jsx'
import Autenticacion from './components/Autenticacion.jsx'
import { useAuth } from './context/useAuth.js'
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
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-content">
          <div className="header-search-hint">Panel de administración de inventario</div>
          <div className="header-account">
            <span className="account-avatar" aria-hidden="true">
              {user.nombre.charAt(0).toLocaleUpperCase('es')}
            </span>
            <span className="account-name">{user.nombre} · {user.rol}</span>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={signOut}>
              Cerrar sesión
            </button>
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
    </div>
  )
}

export default App

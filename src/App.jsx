import { NavLink, Route, Routes } from 'react-router-dom'
import CrudProductos from './components/Productos/CrudProductos.jsx'
import CrudCatalogo from './components/Catalogos/CrudCatalogo.jsx'
import Dashboard from './components/Dashboard.jsx'
import Kardex from './components/Kardex.jsx'
import './App.css'

const navigation = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/productos', label: 'Productos' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/proveedores', label: 'Proveedores' },
  { to: '/kardex', label: 'Kardex' },
]

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="container-fluid app-header-content">
          <span className="app-brand-mark" aria-hidden="true">I</span>
          <span className="app-brand-name">Inventario</span>
          <span className="app-header-label">Panel administrativo</span>
        </div>
      </header>

      <div className="container-fluid app-layout">
        <aside className="app-sidebar" aria-label="Navegación principal">
          <p className="sidebar-label">MENÚ PRINCIPAL</p>
          <nav className="sidebar-nav">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                {label}
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
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App

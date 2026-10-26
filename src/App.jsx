import CrudProductos from './components/Productos/CrudProductos.jsx'
import './App.css'

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="container app-header-content">
          <span className="app-brand-mark" aria-hidden="true">I</span>
          <span className="app-brand-name">Inventario</span>
          <span className="app-header-label">Panel de administración</span>
        </div>
      </header>
      <CrudProductos />
    </main>
  )
}

export default App

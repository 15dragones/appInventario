import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

const emptySummary = {
  totalProductos: 0,
  productosBajoStock: 0,
  totalCategorias: 0,
  totalProveedores: 0,
  productosBajoStockLista: [],
  movimientosRecientes: [],
}

function Dashboard() {
  const [summary, setSummary] = useState(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api.get('/dashboard/resumen', { signal: controller.signal })
      .then(({ data }) => {
        setSummary(data)
        setErrorMessage('')
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [])

  const cards = [
    { title: 'Productos registrados', value: summary.totalProductos, href: '/productos', tone: 'blue' },
    { title: 'Bajo stock (≤ 5)', value: summary.productosBajoStock, href: '/productos', tone: 'orange' },
    { title: 'Categorías', value: summary.totalCategorias, href: '/categorias', tone: 'violet' },
    { title: 'Proveedores', value: summary.totalProveedores, href: '/proveedores', tone: 'green' },
  ]

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="page-eyebrow">Resumen general</p>
        <h1 className="page-title">Inicio</h1>
        <p className="page-subtitle">Estado actual y actividad reciente de tu inventario.</p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">{errorMessage}</div>
      )}

      <div className="row g-3 mb-4">
        {cards.map((card) => (
          <div className="col-12 col-sm-6 col-xl-3" key={card.title}>
            <Link className={`summary-card summary-card-${card.tone}`} to={card.href}>
              <span className="summary-card-title">{card.title}</span>
              <span className="summary-card-value">
                {isLoading || errorMessage ? '—' : card.value}
              </span>
              <span className="summary-card-link">Ver detalle</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <section className="col-12 col-xl-6" aria-labelledby="low-stock-title">
          <div className="product-card product-list-card h-100">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="low-stock-title">Productos con bajo stock</h2>
                <p>Productos con cinco unidades o menos.</p>
              </div>
              <Link className="btn btn-sm btn-outline-primary" to="/kardex">
                Registrar movimiento
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr><th>Producto</th><th>Categoría</th><th>Stock</th></tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="product-empty-state" colSpan="3">Cargando resumen…</td></tr>
                  ) : errorMessage ? (
                    <tr><td className="product-empty-state" colSpan="3">No se pudo cargar la información.</td></tr>
                  ) : summary.productosBajoStockLista.length === 0 ? (
                    <tr><td className="product-empty-state" colSpan="3">No hay productos con bajo stock.</td></tr>
                  ) : summary.productosBajoStockLista.map((producto) => (
                    <tr key={producto.id}>
                      <td className="product-name">{producto.nombre}</td>
                      <td>{producto.categoria?.nombre || '—'}</td>
                      <td><span className="stock-warning">{producto.stock}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="col-12 col-xl-6" aria-labelledby="recent-movements-title">
          <div className="product-card product-list-card h-100">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="recent-movements-title">Movimientos recientes</h2>
                <p>Últimos cambios registrados en el inventario.</p>
              </div>
              <Link className="btn btn-sm btn-outline-primary" to="/kardex">Ver Kardex</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th></tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="product-empty-state" colSpan="4">Cargando actividad…</td></tr>
                  ) : errorMessage ? (
                    <tr><td className="product-empty-state" colSpan="4">No se pudo cargar la información.</td></tr>
                  ) : summary.movimientosRecientes.length === 0 ? (
                    <tr><td className="product-empty-state" colSpan="4">Aún no hay movimientos.</td></tr>
                  ) : summary.movimientosRecientes.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{new Date(movimiento.fechaHora).toLocaleDateString('es-PE')}</td>
                      <td className="product-name">{movimiento.producto?.nombre || '—'}</td>
                      <td>{movimiento.tipoMovimiento}</td>
                      <td>{movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}</td>
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

export default Dashboard

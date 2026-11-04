import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleAlert,
  PackageCheck,
  RefreshCw,
  Tags,
  Truck,
} from 'lucide-react'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

const StockChart = lazy(() => import('./StockChart.jsx'))

const emptySummary = {
  totalProductos: 0,
  productosBajoStock: 0,
  totalCategorias: 0,
  totalProveedores: 0,
  productosBajoStockLista: [],
  movimientosRecientes: [],
}

const chartColors = ['#7252c7', '#24a58a', '#e3a23d', '#df6f7a', '#5389d7', '#a170c8']

async function fetchDashboardData(signal) {
  const [{ data: summary }, { data: products }, { data: categories }] = await Promise.all([
    api.get('/dashboard/resumen', { signal }),
    api.get('/productos', { signal }),
    api.get('/categorias', { signal }),
  ])
  return {
    summary,
    categoryCounts: categories.map((category) => ({
      id: category.id,
      name: category.nombre,
      total: products
        .filter((product) => product.categoriaId === category.id)
        .reduce((stock, product) => stock + Number(product.stock), 0),
    })),
  }
}

function Dashboard() {
  const [summary, setSummary] = useState(emptySummary)
  const [categoryCounts, setCategoryCounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchDashboardData(controller.signal)
      .then(({ summary: dataSummary, categoryCounts: categories }) => {
        setSummary(dataSummary)
        setCategoryCounts(categories)
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

  async function refreshDashboard() {
    setIsRefreshing(true)
    setErrorMessage('')
    try {
      const { summary: dataSummary, categoryCounts: categories } = await fetchDashboardData()
      setSummary(dataSummary)
      setCategoryCounts(categories)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const chartData = categoryCounts
    .filter((category) => category.total > 0)
    .map((category) => ({ name: category.name, value: category.total }))
  const totalUnits = chartData.reduce((total, category) => total + category.value, 0)
  const cards = [
    { title: 'Productos', value: summary.totalProductos, hint: 'Referencias activas', icon: Boxes, tone: 'violet', href: '/productos' },
    { title: 'Unidades disponibles', value: totalUnits, hint: 'Existencias actuales', icon: PackageCheck, tone: 'green', href: '/productos' },
    { title: 'Por reponer', value: summary.productosBajoStock, hint: 'Cinco unidades o menos', icon: CircleAlert, tone: 'amber', href: '/productos' },
    { title: 'Proveedores', value: summary.totalProveedores, hint: 'Socios registrados', icon: Truck, tone: 'blue', href: '/proveedores' },
  ]

  return (
    <div className="page-content dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <div className="dashboard-eyebrow"><Activity size={14} /> CENTRO DE OPERACIONES</div>
          <h1 className="dashboard-title">Resumen del negocio</h1>
          <p className="dashboard-subtitle">Una vista clara de tus existencias y actividad reciente.</p>
        </div>
        <div className="dashboard-actions">
          <button
            type="button"
            className="dashboard-button dashboard-button-secondary"
            onClick={refreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'tw-animate-spin' : ''} />
            Actualizar
          </button>
          <Link to="/kardex" className="dashboard-button dashboard-button-primary">
            <PackageCheck size={16} />
            Registrar movimiento
          </Link>
        </div>
      </header>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">{errorMessage}</div>
      )}

      <section className="dashboard-welcome" aria-label="Estado del inventario">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-welcome-tag"><span /> INVENTARIO EN SEGUIMIENTO</span>
          <h2>Tu operación, siempre bajo control.</h2>
          <p>Revisa lo que tienes, identifica lo que falta y registra cada movimiento de tu negocio.</p>
          <Link to="/productos" className="dashboard-welcome-link">
            Explorar productos <ArrowRight size={15} />
          </Link>
        </div>
        <div className="dashboard-welcome-art" aria-hidden="true">
          <div className="dashboard-art-ring dashboard-art-ring-one" />
          <div className="dashboard-art-ring dashboard-art-ring-two" />
          <div className="dashboard-art-box"><Boxes size={50} strokeWidth={1.4} /></div>
          <div className="dashboard-art-tag dashboard-art-tag-top"><Tags size={14} /> Catálogo organizado</div>
          <div className="dashboard-art-tag dashboard-art-tag-bottom"><Activity size={14} /> Actividad en vivo</div>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Indicadores del inventario">
        {cards.map(({ title, value, hint, icon: Icon, tone, href }) => {
          const isAlert = tone === 'amber' && Number(value) > 0
          return (
            <Link
              to={href}
              key={title}
              className={`dashboard-stat-card dashboard-stat-${tone}${isAlert ? ' dashboard-stat-alert' : ''}`}
            >
              <span className="dashboard-stat-icon"><Icon size={19} strokeWidth={1.9} /></span>
              <span className="dashboard-stat-title">{title}</span>
              <span className="dashboard-stat-value">
                {isLoading || errorMessage ? '—' : Number(value).toLocaleString('es-PE')}
              </span>
              <span className="dashboard-stat-hint">{hint}<ArrowRight size={13} /></span>
            </Link>
          )
        })}
      </section>

      <div className="dashboard-primary-grid">
        <section className="dashboard-card dashboard-stock-card" aria-labelledby="category-chart-title">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-kicker">DISTRIBUCIÓN</span>
              <h2 id="category-chart-title">Existencias por categoría</h2>
              <p>Cómo se reparte el stock de tu negocio.</p>
            </div>
            <span className="dashboard-heading-icon"><Boxes size={17} /></span>
          </div>
          {isLoading ? (
            <div className="dashboard-empty-state">Cargando categorías…</div>
          ) : errorMessage ? (
            <div className="dashboard-empty-state">No se pudo cargar la información.</div>
          ) : chartData.length === 0 ? (
            <div className="dashboard-empty-state">Aún no hay existencias para mostrar.</div>
          ) : (
            <Suspense fallback={<div className="dashboard-empty-state">Cargando gráfico…</div>}>
              <StockChart categories={chartData} colors={chartColors} />
            </Suspense>
          )}
        </section>

        <section className="dashboard-card dashboard-low-stock" aria-labelledby="low-stock-title">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-card-kicker dashboard-kicker-warning">ATENCIÓN</span>
              <h2 id="low-stock-title">Conviene reponer</h2>
              <p>Productos con cinco unidades o menos.</p>
            </div>
            <span className="dashboard-heading-icon dashboard-heading-icon-warning"><CircleAlert size={17} /></span>
          </div>
          {isLoading ? (
            <div className="dashboard-empty-state">Revisando existencias…</div>
          ) : errorMessage ? (
            <div className="dashboard-empty-state">No se pudo cargar la información.</div>
          ) : summary.productosBajoStockLista.length === 0 ? (
            <div className="dashboard-low-stock-clear">
              <PackageCheck size={23} />
              <strong>Todo en orden</strong>
              <span>No hay productos que requieran reposición.</span>
            </div>
          ) : (
            <div className="dashboard-reorder-list">
              {summary.productosBajoStockLista.slice(0, 5).map((product) => (
                <Link to="/productos" key={product.id} className="dashboard-reorder-item">
                  <span className="dashboard-product-mark"><Boxes size={16} /></span>
                  <span className="dashboard-product-info">
                    <strong>{product.nombre}</strong>
                    <small>{product.categoria?.nombre || 'Sin categoría'}</small>
                  </span>
                  <span className="dashboard-stock-count">
                    <strong>{product.stock}</strong><small>unid.</small>
                  </span>
                </Link>
              ))}
              <Link to="/productos" className="dashboard-view-all">
                Ver inventario completo <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="dashboard-card dashboard-activity-card" aria-labelledby="recent-movements-title">
        <div className="dashboard-card-heading dashboard-activity-heading">
          <div>
            <span className="dashboard-card-kicker">TRAZABILIDAD</span>
            <h2 id="recent-movements-title">Actividad reciente</h2>
            <p>Últimos cambios registrados en el Kardex.</p>
          </div>
          <Link to="/kardex" className="dashboard-view-all">
            Ver todos los movimientos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                {['Fecha', 'Producto', 'Movimiento', 'Cantidad', 'Registrado por'].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="dashboard-table-empty" colSpan="5">Cargando movimientos…</td></tr>
              ) : errorMessage ? (
                <tr><td className="dashboard-table-empty" colSpan="5">No se pudo cargar la actividad.</td></tr>
              ) : summary.movimientosRecientes.length === 0 ? (
                <tr><td className="dashboard-table-empty" colSpan="5">Aún no hay movimientos.</td></tr>
              ) : summary.movimientosRecientes.map((movement) => {
                const isEntry = movement.tipoMovimiento === 'Entrada'
                const isExit = movement.tipoMovimiento === 'Salida'
                const movementStyle = isEntry ? 'dashboard-movement-entry'
                  : isExit ? 'dashboard-movement-exit' : 'dashboard-movement-adjustment'
                return (
                  <tr key={movement.id}>
                    <td className="dashboard-date-cell">
                      {new Date(movement.fechaHora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="dashboard-product-cell">{movement.producto?.nombre || '—'}</td>
                    <td>
                      <span className={`dashboard-movement-badge ${movementStyle}`}>
                        {isEntry ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                        {movement.tipoMovimiento}
                      </span>
                    </td>
                    <td className={movement.cantidad > 0 ? 'dashboard-quantity-positive' : 'dashboard-quantity-negative'}>
                      {movement.cantidad > 0 ? '+' : ''}{movement.cantidad}
                    </td>
                    <td className="dashboard-user-cell">{movement.usuario?.nombre || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard

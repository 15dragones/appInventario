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

const chartColors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#38bdf8', '#8b5cf6']
const cardStyles = [
  { icon: Boxes, tone: 'tw-bg-indigo-50 tw-text-indigo-600', href: '/productos' },
  { icon: Tags, tone: 'tw-bg-sky-50 tw-text-sky-600', href: '/categorias' },
  { icon: Truck, tone: 'tw-bg-emerald-50 tw-text-emerald-600', href: '/proveedores' },
  { icon: CircleAlert, tone: 'tw-bg-rose-50 tw-text-rose-600', href: '/productos' },
]

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

  const cards = [
    { title: 'Productos', value: summary.totalProductos, hint: 'En el inventario' },
    { title: 'Categorías', value: summary.totalCategorias, hint: 'Tipos de productos' },
    { title: 'Proveedores', value: summary.totalProveedores, hint: 'Socios registrados' },
    { title: 'Stock bajo', value: summary.productosBajoStock, hint: 'Requieren atención' },
  ]

  const chartData = categoryCounts
    .filter((category) => category.total > 0)
    .map((category) => ({ name: category.name, value: category.total }))

  return (
    <div className="page-content tw-bg-[#f6f7fb]">
      <div className="tw-mb-6 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4">
        <div>
          <div className="tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-indigo-600">
            <Activity size={15} strokeWidth={2.2} />
            Resumen general
          </div>
          <h1 className="tw-m-0 tw-text-3xl tw-font-bold tw-tracking-tight tw-text-slate-900">
            Dashboard
          </h1>
          <p className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-text-slate-500">
            Aquí tienes el estado actual de tu inventario.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-text-sm tw-font-medium tw-text-slate-600 tw-shadow-sm tw-transition hover:tw-border-indigo-200 hover:tw-text-indigo-700 disabled:tw-opacity-60"
            onClick={refreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'tw-animate-spin' : ''} />
            Actualizar
          </button>
          <Link
            to="/kardex"
            className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-indigo-600 tw-px-4 tw-text-sm tw-font-semibold tw-text-white tw-no-underline tw-shadow-sm tw-transition hover:tw-bg-indigo-700"
          >
            <PackageCheck size={16} />
            Nuevo movimiento
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">{errorMessage}</div>
      )}

      <div className="tw-mb-5 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
        {cards.map((card, index) => {
          const Icon = cardStyles[index].icon
          const isAlert = index === 3 && Number(card.value) > 0
          const iconTone = isAlert
            ? 'tw-bg-rose-50 tw-text-rose-600'
            : cardStyles[index].tone
          return (
            <Link
              to={cardStyles[index].href}
              key={card.title}
              className={`tw-group tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-200/80 tw-bg-white tw-p-4 tw-text-inherit tw-no-underline tw-shadow-[0_2px_8px_rgba(15,23,42,0.035)] tw-transition hover:-tw-translate-y-0.5 hover:tw-border-indigo-200 hover:tw-shadow-[0_10px_24px_rgba(15,23,42,0.08)] ${isAlert ? 'tw-border-rose-200' : ''}`}
            >
              <span className="tw-flex tw-items-start tw-justify-between">
                <span className="tw-text-sm tw-font-medium tw-text-slate-500">{card.title}</span>
                <span className={`tw-grid tw-h-10 tw-w-10 tw-place-items-center tw-rounded-xl ${iconTone}`}>
                  <Icon size={19} strokeWidth={1.9} />
                </span>
              </span>
              <span className={`tw-mt-3 tw-block tw-text-3xl tw-font-bold tw-leading-none tw-tracking-tight ${isAlert ? 'tw-text-rose-600' : 'tw-text-slate-900'}`}>
                {isLoading || errorMessage ? '—' : Number(card.value).toLocaleString('es-PE')}
              </span>
              <span className="tw-mt-2 tw-flex tw-items-center tw-gap-1 tw-text-xs tw-text-slate-400">
                {card.hint}
                <ArrowUpRight size={13} className="tw-ml-auto tw-text-slate-300 tw-transition group-hover:tw-text-indigo-500" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="tw-mb-5 tw-grid tw-grid-cols-1 tw-gap-4 xl:tw-grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-200/80 tw-bg-white tw-shadow-[0_2px_8px_rgba(15,23,42,0.035)]" aria-labelledby="recent-movements-title">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-100 tw-px-5 tw-py-4">
            <div>
              <h2 id="recent-movements-title" className="tw-m-0 tw-text-sm tw-font-semibold tw-text-slate-800">
                Movimientos recientes
              </h2>
              <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-slate-400">Actividad del Kardex</p>
            </div>
            <Link to="/kardex" className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-indigo-600 tw-no-underline hover:tw-text-indigo-800">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="tw-overflow-x-auto">
            <table className="tw-w-full tw-border-collapse tw-text-left">
              <thead>
                <tr className="tw-bg-slate-50/80">
                  {['Fecha', 'Producto', 'Movimiento', 'Cantidad', 'Usuario'].map((heading) => (
                    <th key={heading} className="tw-whitespace-nowrap tw-px-5 tw-py-3 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-slate-400">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="tw-px-5 tw-py-9 tw-text-center tw-text-sm tw-text-slate-400" colSpan="5">Cargando movimientos…</td></tr>
                ) : errorMessage ? (
                  <tr><td className="tw-px-5 tw-py-9 tw-text-center tw-text-sm tw-text-slate-400" colSpan="5">No se pudo cargar la actividad.</td></tr>
                ) : summary.movimientosRecientes.length === 0 ? (
                  <tr><td className="tw-px-5 tw-py-9 tw-text-center tw-text-sm tw-text-slate-400" colSpan="5">Aún no hay movimientos.</td></tr>
                ) : summary.movimientosRecientes.map((movement) => {
                  const isEntry = movement.tipoMovimiento === 'Entrada'
                  const isExit = movement.tipoMovimiento === 'Salida'
                  const movementStyle = isEntry
                    ? 'tw-bg-emerald-50 tw-text-emerald-700'
                    : isExit ? 'tw-bg-rose-50 tw-text-rose-700' : 'tw-bg-amber-50 tw-text-amber-700'
                  return (
                    <tr key={movement.id} className="tw-border-t tw-border-slate-100 hover:tw-bg-slate-50/60">
                      <td className="tw-whitespace-nowrap tw-px-5 tw-py-3.5 tw-text-xs tw-text-slate-500">
                        {new Date(movement.fechaHora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="tw-whitespace-nowrap tw-px-5 tw-py-3.5 tw-text-xs tw-font-semibold tw-text-slate-700">
                        {movement.producto?.nombre || '—'}
                      </td>
                      <td className="tw-px-5 tw-py-3.5">
                        <span className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[10px] tw-font-semibold ${movementStyle}`}>
                          {isEntry ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                          {movement.tipoMovimiento}
                        </span>
                      </td>
                      <td className={`tw-whitespace-nowrap tw-px-5 tw-py-3.5 tw-text-xs tw-font-semibold ${movement.cantidad > 0 ? 'tw-text-emerald-700' : 'tw-text-rose-600'}`}>
                        {movement.cantidad > 0 ? '+' : ''}{movement.cantidad}
                      </td>
                      <td className="tw-whitespace-nowrap tw-px-5 tw-py-3.5 tw-text-xs tw-text-slate-500">
                        {movement.usuario?.nombre || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-200/80 tw-bg-white tw-shadow-[0_2px_8px_rgba(15,23,42,0.035)]" aria-labelledby="category-chart-title">
          <div className="tw-border-b tw-border-slate-100 tw-px-5 tw-py-4">
            <h2 id="category-chart-title" className="tw-m-0 tw-text-sm tw-font-semibold tw-text-slate-800">Stock por categoría</h2>
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-slate-400">Distribución de unidades</p>
          </div>
          {isLoading ? (
            <div className="tw-grid tw-min-h-[260px] tw-place-items-center tw-text-sm tw-text-slate-400">Cargando categorías…</div>
          ) : errorMessage ? (
            <div className="tw-grid tw-min-h-[260px] tw-place-items-center tw-p-5 tw-text-center tw-text-sm tw-text-slate-400">No se pudo cargar la información.</div>
          ) : chartData.length === 0 ? (
            <div className="tw-grid tw-min-h-[260px] tw-place-items-center tw-p-5 tw-text-center tw-text-sm tw-text-slate-400">Aún no hay existencias para mostrar.</div>
          ) : (
            <Suspense fallback={<div className="tw-grid tw-min-h-[260px] tw-place-items-center tw-text-sm tw-text-slate-400">Cargando gráfico…</div>}>
              <StockChart categories={chartData} colors={chartColors} />
            </Suspense>
          )}
        </section>
      </div>

      <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-slate-200/80 tw-bg-white tw-shadow-[0_2px_8px_rgba(15,23,42,0.035)]" aria-labelledby="low-stock-title">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-slate-100 tw-px-5 tw-py-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <span className="tw-grid tw-h-9 tw-w-9 tw-place-items-center tw-rounded-lg tw-bg-amber-50 tw-text-amber-600">
              <CircleAlert size={18} />
            </span>
            <div>
              <h2 id="low-stock-title" className="tw-m-0 tw-text-sm tw-font-semibold tw-text-slate-800">Productos con bajo stock</h2>
              <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-slate-400">Cinco unidades o menos</p>
            </div>
          </div>
          <Link to="/productos" className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-font-semibold tw-text-indigo-600 tw-no-underline hover:tw-text-indigo-800">
            Ver productos <ArrowRight size={14} />
          </Link>
        </div>
        <div className="tw-overflow-x-auto">
          <table className="tw-w-full tw-border-collapse tw-text-left">
            <thead>
              <tr className="tw-bg-slate-50/80">
                {['Producto', 'Categoría', 'Stock'].map((heading) => (
                  <th key={heading} className="tw-px-5 tw-py-3 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wider tw-text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="tw-px-5 tw-py-7 tw-text-center tw-text-sm tw-text-slate-400" colSpan="3">Cargando productos…</td></tr>
              ) : errorMessage ? (
                <tr><td className="tw-px-5 tw-py-7 tw-text-center tw-text-sm tw-text-slate-400" colSpan="3">No se pudo cargar la información.</td></tr>
              ) : summary.productosBajoStockLista.length === 0 ? (
                <tr><td className="tw-px-5 tw-py-7 tw-text-center tw-text-sm tw-text-slate-400" colSpan="3">No hay productos con bajo stock.</td></tr>
              ) : summary.productosBajoStockLista.map((product) => (
                <tr key={product.id} className="tw-border-t tw-border-slate-100 hover:tw-bg-slate-50/60">
                  <td className="tw-px-5 tw-py-3 tw-text-xs tw-font-semibold tw-text-slate-700">{product.nombre}</td>
                  <td className="tw-px-5 tw-py-3 tw-text-xs tw-text-slate-500">{product.categoria?.nombre || '—'}</td>
                  <td className="tw-px-5 tw-py-3">
                    <span className="tw-inline-flex tw-min-w-8 tw-justify-center tw-rounded-md tw-bg-amber-50 tw-px-2 tw-py-1 tw-text-xs tw-font-bold tw-text-amber-700">{product.stock}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Dashboard

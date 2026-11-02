import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

const initialForm = {
  productoId: '',
  tipoMovimiento: 'Entrada',
  cantidad: '',
  observaciones: '',
}

function Kardex() {
  const [productos, setProductos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const cargarDatos = useCallback(async () => {
    setIsLoading(true)
    try {
      const [productosResponse, movimientosResponse] = await Promise.all([
        api.get('/productos'),
        api.get('/movimientos'),
      ])
      setProductos(productosResponse.data)
      setMovimientos(movimientosResponse.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([api.get('/productos'), api.get('/movimientos')])
      .then(([productosResponse, movimientosResponse]) => {
        if (active) {
          setProductos(productosResponse.data)
          setMovimientos(movimientosResponse.data)
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

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')
    try {
      await api.post('/movimientos', {
        ...form,
        productoId: Number(form.productoId),
        cantidad: Number(form.cantidad),
      })
      setForm(initialForm)
      setIsFormOpen(false)
      await cargarDatos()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const filteredMovements = movimientos.filter((movement) => (
    `${movement.producto?.nombre || ''} ${movement.tipoMovimiento} ${movement.usuario?.nombre || ''} ${movement.observaciones || ''}`
      .toLocaleLowerCase('es')
      .includes(search.trim().toLocaleLowerCase('es'))
  ))

  return (
    <div className="page-content">
      <div className="page-heading">
        <p className="page-eyebrow">Control de existencias</p>
        <h1 className="page-title">Kardex / Movimientos</h1>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert" aria-live="polite">
          {errorMessage}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={cargarDatos}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="page-toolbar">
        <input
          className="form-control table-search"
          type="search"
          aria-label="Buscar movimientos"
          placeholder="Buscar por producto, tipo o usuario..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-primary toolbar-primary" type="button" onClick={() => setIsFormOpen(true)}>
          + Registrar movimiento
        </button>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false)
        }}>
          <section className="modal-card-custom" role="dialog" aria-modal="true" aria-labelledby="movement-form-title">
            <div className="product-card-heading modal-heading">
              <div>
                <h2 id="movement-form-title">Registrar movimiento</h2>
                <p>El stock se actualizará al guardar.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Cerrar" onClick={() => setIsFormOpen(false)}>×</button>
            </div>
            <form className="product-form-body" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="productoId">Producto</label>
                <select
                  id="productoId"
                  className="form-select"
                  name="productoId"
                  value={form.productoId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} · stock {producto.stock}
                    </option>
                  ))}
                </select>
                {productos.length === 0 && !isLoading && (
                  <small className="text-muted">Primero registra un producto.</small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="tipoMovimiento">Tipo</label>
                <select
                  id="tipoMovimiento"
                  className="form-select"
                  name="tipoMovimiento"
                  value={form.tipoMovimiento}
                  onChange={handleChange}
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                  <option value="Ajuste">Ajuste</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="cantidad">
                  {form.tipoMovimiento === 'Ajuste' ? 'Variación (+ / -)' : 'Cantidad'}
                </label>
                <input
                  id="cantidad"
                  className="form-control"
                  type="number"
                  name="cantidad"
                  step="1"
                  min={form.tipoMovimiento === 'Ajuste' ? undefined : '1'}
                  value={form.cantidad}
                  onChange={handleChange}
                  required
                />
                {form.tipoMovimiento === 'Ajuste' && (
                  <small className="text-muted">
                    Usa un número positivo para aumentar o negativo para reducir el stock.
                  </small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="observaciones">Motivo / observaciones</label>
                <textarea
                  id="observaciones"
                  className="form-control"
                  name="observaciones"
                  rows="3"
                  maxLength="1000"
                  value={form.observaciones}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                className="btn btn-primary product-submit-button w-100"
                type="submit"
                disabled={isSaving || productos.length === 0}
              >
                {isSaving ? 'Registrando…' : 'Registrar movimiento'}
              </button>
            </form>
          </section>
        </div>
      )}

      <section aria-labelledby="movement-list-title">
          <div className="product-card product-list-card">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="movement-list-title">Lista de movimientos (Kardex)</h2>
                <p>Registro cronológico de cambios de stock.</p>
              </div>
              <span className="product-count">{filteredMovements.length} movimientos</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Fecha / Hora</th><th>Producto</th><th>Tipo</th>
                    <th>Cantidad</th><th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td className="product-empty-state" colSpan="6">Cargando movimientos…</td></tr>
                  ) : errorMessage ? (
                    <tr><td className="product-empty-state" colSpan="6">No se pudo cargar la información.</td></tr>
                  ) : filteredMovements.length === 0 ? (
                    <tr><td className="product-empty-state" colSpan="6">
                      {search ? 'No hay movimientos que coincidan con la búsqueda.' : 'Aún no hay movimientos registrados.'}
                    </td></tr>
                  ) : filteredMovements.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td>{String(movimiento.id).padStart(3, '0')}</td>
                      <td>{new Date(movimiento.fechaHora).toLocaleString('es-PE')}</td>
                      <td className="product-name">{movimiento.producto?.nombre || '—'}</td>
                      <td>
                        <span className={`movement-badge movement-${movimiento.tipoMovimiento === 'Entrada' ? 'entry' : movimiento.tipoMovimiento === 'Salida' ? 'exit' : 'adjustment'}`}>
                          {movimiento.tipoMovimiento}
                        </span>
                      </td>
                      <td className={movimiento.cantidad > 0 ? 'text-success' : 'text-danger'}>
                        {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                      </td>
                      <td>{movimiento.usuario?.nombre || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
    </div>
  )
}

export default Kardex

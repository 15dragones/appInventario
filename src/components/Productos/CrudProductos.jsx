import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api.js'
import { getApiErrorMessage } from '../../services/errors.js'

const emptyForm = {
  id: null,
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  categoriaId: '',
  proveedorId: '',
}

function CrudProductos() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const obtenerProductos = useCallback(async () => {
    try {
      const [productosResponse, categoriasResponse, proveedoresResponse] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
        api.get('/proveedores'),
      ])
      setProductos(productosResponse.data)
      setCategorias(categoriasResponse.data)
      setProveedores(proveedoresResponse.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      api.get('/productos', { signal: controller.signal }),
      api.get('/categorias', { signal: controller.signal }),
      api.get('/proveedores', { signal: controller.signal }),
    ])
      .then(([productosResponse, categoriasResponse, proveedoresResponse]) => {
        setProductos(productosResponse.data)
        setCategorias(categoriasResponse.data)
        setProveedores(proveedoresResponse.data)
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

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage('')

    const producto = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      categoriaId: Number(form.categoriaId),
      proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
    }

    try {
      if (form.id) {
        await api.put(`/productos/${form.id}`, producto)
      } else {
        await api.post('/productos', { ...producto, stock: Number(form.stock) })
      }

      resetForm()
      setIsLoading(true)
      await obtenerProductos()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(producto) {
    setForm({
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId || '',
      proveedorId: producto.proveedorId || '',
    })
    setErrorMessage('')
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) {
      return
    }

    setDeletingId(id)
    setErrorMessage('')

    try {
      await api.delete(`/productos/${id}`)
      if (form.id === id) {
        resetForm()
      }
      setIsLoading(true)
      await obtenerProductos()
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container py-4 py-md-5">
      <div className="page-heading">
        <p className="page-eyebrow">Inventario</p>
        <h1 className="page-title">Gestión de productos</h1>
        <p className="page-subtitle">
          Administra los productos, precios y existencias de tu inventario.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert" aria-live="polite">
          {errorMessage}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => {
              setIsLoading(true)
              obtenerProductos()
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="row g-4">
        <section className="col-12 col-lg-4" aria-labelledby="product-form-title">
          <div className="product-card h-100">
            <div className="product-card-heading">
              <h2 id="product-form-title">
                {form.id ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <p>Completa los datos del producto.</p>
            </div>
            <form className="product-form-body" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  className="form-control"
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  maxLength={255}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="categoriaId">Categoría</label>
                <select
                  id="categoriaId"
                  className="form-select"
                  name="categoriaId"
                  value={form.categoriaId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </select>
                {categorias.length === 0 && (
                  <small className="text-muted">
                    Registra una categoría antes de crear productos.
                  </small>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="proveedorId">Proveedor (opcional)</label>
                <select
                  id="proveedorId"
                  className="form-select"
                  name="proveedorId"
                  value={form.proveedorId}
                  onChange={handleChange}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.razonSocial}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="descripcion">Descripción</label>
                <input
                  id="descripcion"
                  className="form-control"
                  type="text"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                />
              </div>
              <div className="row">
                <div className="col-7 mb-3">
                  <label className="form-label" htmlFor="precio">Precio (S/)</label>
                  <input
                    id="precio"
                    className="form-control"
                    type="number"
                    name="precio"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-5 mb-3">
                  <label className="form-label" htmlFor="stock">
                    {form.id ? 'Stock actual' : 'Stock inicial'}
                  </label>
                  <input
                    id="stock"
                    className="form-control"
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    readOnly={Boolean(form.id)}
                    required
                  />
                </div>
              </div>
              {!form.id && (
                <p className="form-text">
                  Si el saldo inicial es mayor que cero, se registrará como entrada en el Kardex.
                </p>
              )}
              {form.id && (
                <p className="form-text">
                  El stock se modifica desde el Kardex para conservar el historial.
                </p>
              )}
              <button
                className="btn btn-primary product-submit-button w-100"
                type="submit"
                disabled={isSaving || categorias.length === 0}
              >
                {isSaving ? 'Guardando…' : form.id ? 'Actualizar producto' : 'Guardar producto'}
              </button>
              {form.id && (
                <button
                  className="btn btn-link text-secondary w-100 mt-2 text-decoration-none"
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </div>
        </section>

        <section className="col-12 col-lg-8" aria-labelledby="product-list-title">
          <div className="product-card product-list-card">
            <div className="product-card-heading product-list-heading">
              <div>
                <h2 id="product-list-title">Lista de productos</h2>
                <p>Productos registrados en tu inventario.</p>
              </div>
              <span className="product-count">
                {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover product-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Proveedor</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Precio</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td className="product-empty-state" colSpan="8">
                        Cargando productos…
                      </td>
                    </tr>
                  ) : errorMessage ? (
                    <tr>
                      <td className="product-empty-state" colSpan="8">
                        No se pudo cargar la información.
                      </td>
                    </tr>
                  ) : productos.length === 0 ? (
                    <tr>
                      <td className="product-empty-state" colSpan="8">
                        Aún no hay productos. Registra el primero usando el formulario.
                      </td>
                    </tr>
                  ) : (
                    productos.map((producto) => (
                      <tr key={producto.id}>
                        <td>{producto.id}</td>
                        <td className="product-name">{producto.nombre}</td>
                        <td>{producto.categoria?.nombre || '—'}</td>
                        <td>{producto.proveedor?.razonSocial || '—'}</td>
                        <td className="product-description" title={producto.descripcion || ''}>
                          {producto.descripcion || '—'}
                        </td>
                        <td>S/ {Number(producto.precio).toFixed(2)}</td>
                        <td>{producto.stock}</td>
                        <td>
                          <div className="product-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => handleEdit(producto)}
                              disabled={deletingId === producto.id}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              type="button"
                              onClick={() => handleDelete(producto.id)}
                              disabled={deletingId === producto.id}
                            >
                              {deletingId === producto.id ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default CrudProductos

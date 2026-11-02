import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import api from '../services/api.js'
import { getApiErrorMessage } from '../services/errors.js'

function Autenticacion({ registro = false }) {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' })
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  if (user) return <Navigate to="/" replace />

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (registro && form.password !== form.confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setIsSaving(true)
    try {
      if (registro) {
        const { data } = await api.post('/api/auth/register', {
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        setSuccessMessage(`${data.message} Rol asignado: ${data.user.rol}.`)
      } else {
        await signIn({ email: form.email.trim(), password: form.password })
        navigate('/', { replace: true })
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Boxes size={22} strokeWidth={2.2} /></span>
          <span><strong>SENATI</strong><small>Sistema de Inventario</small></span>
        </div>

        <div className="auth-heading">
          <span className="auth-heading-icon">
            {registro ? <ShieldCheck size={20} /> : <LockKeyhole size={20} />}
          </span>
          <h1 id="auth-title">{registro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p>
            {registro
              ? 'Regístrate para acceder al panel de inventario.'
              : 'Ingresa tus credenciales para continuar.'}
          </p>
        </div>

        {errorMessage && <div className="alert alert-danger py-2" role="alert">{errorMessage}</div>}
        {successMessage && (
          <div className="alert alert-success py-2" role="status">
            {successMessage}{' '}
            <Link to="/login" className="alert-link">Iniciar sesión</Link>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {registro && (
            <div className="mb-3">
              <label className="form-label" htmlFor="auth-name">Nombre completo</label>
              <input
                id="auth-name"
                className="form-control"
                name="nombre"
                autoComplete="name"
                maxLength="120"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label" htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              className="form-control"
              type="email"
              name="email"
              autoComplete="email"
              maxLength="180"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="auth-password">Contraseña</label>
            <input
              id="auth-password"
              className="form-control"
              type="password"
              name="password"
              autoComplete={registro ? 'new-password' : 'current-password'}
              minLength="8"
              maxLength={registro ? 72 : 128}
              value={form.password}
              onChange={handleChange}
              required
            />
            {registro && <small className="form-text">Mínimo 8 caracteres.</small>}
          </div>
          {registro && (
            <div className="mb-3">
              <label className="form-label" htmlFor="auth-confirm-password">Confirmar contraseña</label>
              <input
                id="auth-confirm-password"
                className="form-control"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                minLength="8"
                maxLength="72"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <button className="btn btn-primary auth-submit" type="submit" disabled={isSaving}>
            {isSaving
              ? 'Procesando…'
              : registro ? 'Crear cuenta' : 'Iniciar sesión'}
            {!isSaving && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          {registro ? '¿Ya tienes una cuenta?' : '¿Aún no tienes una cuenta?'}{' '}
          <Link to={registro ? '/login' : '/register'}>
            {registro ? 'Inicia sesión' : 'Regístrate'}
          </Link>
        </p>
        {registro && (
          <p className="auth-note">
            La primera cuenta recibe el rol Administrador. Los registros siguientes son Almaceneros.
          </p>
        )}
      </section>
    </main>
  )
}

export default Autenticacion

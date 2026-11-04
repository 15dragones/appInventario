import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  KeyRound,
  LockKeyhole,
  Mail,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
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
      <section className="auth-shell" aria-labelledby="auth-title">
        <aside className="auth-showcase">
          <div className="auth-brand auth-brand-light">
            <span className="auth-brand-icon"><Boxes size={22} strokeWidth={2.2} /></span>
            <span><strong>SENATI</strong><small>Sistema de Inventario</small></span>
          </div>

          <div className="auth-showcase-content">
            <p className="auth-eyebrow"><span /> CONTROL SIMPLE, INVENTARIO EN ORDEN</p>
            <h2>Todo tu inventario.<br /><span>En un solo lugar.</span></h2>
            <p className="auth-showcase-copy">
              Organiza tus productos, revisa existencias y mantén cada movimiento bajo control.
            </p>

            <div className="auth-illustration" aria-hidden="true">
              <div className="auth-illustration-glow" />
              <div className="auth-orbit auth-orbit-one" />
              <div className="auth-orbit auth-orbit-two" />
              <div className="auth-center-mark"><Boxes size={58} strokeWidth={1.35} /></div>
              <div className="auth-float-card auth-float-card-top">
                <span className="auth-float-icon"><PackageCheck size={18} /></span>
                <span><strong>Productos</strong><small>Todo organizado</small></span>
                <span className="auth-float-check">✓</span>
              </div>
              <div className="auth-float-card auth-float-card-bottom">
                <span className="auth-live-dot" />
                <span><strong>Tu inventario</strong><small>Siempre al día</small></span>
              </div>
            </div>
          </div>

          <p className="auth-showcase-footer">
            <ShieldCheck size={15} />
            Una herramienta clara para trabajar mejor.
          </p>
        </aside>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-brand auth-brand-mobile">
              <span className="auth-brand-icon"><Boxes size={22} strokeWidth={2.2} /></span>
              <span><strong>SENATI</strong><small>Sistema de Inventario</small></span>
            </div>

            <div className="auth-heading">
              <span className="auth-heading-icon">
                {registro ? <ShieldCheck size={19} /> : <LockKeyhole size={19} />}
              </span>
              <p className="auth-kicker">{registro ? 'ÚNETE AL EQUIPO' : 'ACCESO SEGURO'}</p>
              <h1 id="auth-title">{registro ? 'Crea tu cuenta' : 'Qué gusto tenerte de vuelta'}</h1>
              <p>
                {registro
                  ? 'Completa tus datos para comenzar a gestionar tu inventario.'
                  : 'Ingresa tus datos para continuar con tu espacio de trabajo.'}
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
                <div className="auth-field">
                  <label className="form-label" htmlFor="auth-name">Nombre completo</label>
                  <div className="auth-input-wrap">
                    <UserRound className="auth-input-icon" size={17} aria-hidden="true" />
                    <input
                      id="auth-name"
                      className="form-control"
                      name="nombre"
                      autoComplete="name"
                      maxLength="120"
                      placeholder="Tu nombre y apellido"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="auth-field">
                <label className="form-label" htmlFor="auth-email">Correo electrónico</label>
                <div className="auth-input-wrap">
                  <Mail className="auth-input-icon" size={17} aria-hidden="true" />
                  <input
                    id="auth-email"
                    className="form-control"
                    type="email"
                    name="email"
                    autoComplete="email"
                    maxLength="180"
                    placeholder="nombre@ejemplo.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label className="form-label" htmlFor="auth-password">Contraseña</label>
                <div className="auth-input-wrap">
                  <KeyRound className="auth-input-icon" size={17} aria-hidden="true" />
                  <input
                    id="auth-password"
                    className="form-control"
                    type="password"
                    name="password"
                    autoComplete={registro ? 'new-password' : 'current-password'}
                    minLength="8"
                    maxLength={registro ? 72 : 128}
                    placeholder={registro ? 'Crea una contraseña segura' : 'Ingresa tu contraseña'}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                {registro && <small className="auth-field-hint">Usa al menos 8 caracteres.</small>}
              </div>
              {registro && (
                <div className="auth-field">
                  <label className="form-label" htmlFor="auth-confirm-password">Confirmar contraseña</label>
                  <div className="auth-input-wrap">
                    <LockKeyhole className="auth-input-icon" size={17} aria-hidden="true" />
                    <input
                      id="auth-confirm-password"
                      className="form-control"
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      minLength="8"
                      maxLength="72"
                      placeholder="Escríbela de nuevo"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
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
          </div>
          <p className="auth-legal">SENATI · Sistema de Inventario</p>
        </div>
      </section>
    </main>
  )
}

export default Autenticacion

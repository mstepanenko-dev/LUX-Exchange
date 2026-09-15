import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/api.js'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(form)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand"><span className="brand-mark">L</span>UX EXCHANGE</div>
        <p className="eyebrow">Private digital finance</p>
        <h1>Welcome back.</h1>
        <p className="subtitle">Access your global wallet portfolio.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            Email address
            <input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" />
          </label>
          <label className="field">
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required autoComplete="current-password" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">New to LUX? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  )
}

export default Login
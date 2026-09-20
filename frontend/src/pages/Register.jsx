import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/api.js'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await register(form)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="brand"><span className="brand-mark">L</span>UX EXCHANGE</div>
        <p className="eyebrow">Begin your portfolio</p>
        <h1>Open your account.</h1>
        <p className="subtitle">One secure home for your digital assets.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">First name<input name="firstName" value={form.firstName} onChange={handleChange} required autoComplete="given-name" /></label>
            <label className="field">Last name<input name="lastName" value={form.lastName} onChange={handleChange} required autoComplete="family-name" /></label>
          </div>
          <label className="field">Email address<input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" /></label>
          <label className="field">Password<span className="password-input-wrap"><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required autoComplete="new-password" /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={`${showPassword ? 'Hide' : 'Show'} password`}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}

export default Register
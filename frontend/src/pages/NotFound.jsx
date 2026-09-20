import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main className="auth-page not-found-page">
      <section className="auth-panel not-found-panel">
        <div className="brand"><span className="brand-mark">L</span>UX EXCHANGE</div>
        <p className="not-found-code">404</p>
        <h1>Page not found.</h1>
        <p className="subtitle">The page you're looking for doesn't exist.</p>
        <div className="not-found-actions">
          <Link className="primary-button" to="/dashboard">Back to dashboard</Link>
          <Link className="secondary-button" to="/login">Go to login</Link>
        </div>
      </section>
    </main>
  )
}

export default NotFound

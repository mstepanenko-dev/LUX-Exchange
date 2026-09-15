import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getWallets } from '../services/api.js'

const currencies = ['GBP', 'EUR', 'USD', 'USDT', 'BTC']

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    setUser(storedUser ? JSON.parse(storedUser) : null)

    const loadWallets = async () => {
      try {
        const response = await getWallets()
        setWallets(response.wallets || [])
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Unable to load wallets.')
      } finally {
        setLoading(false)
      }
    }

    loadWallets()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  const getBalance = (currency) => {
    const wallet = wallets.find((item) => item.currency === currency)
    const balance = Number(wallet?.balance || 0)
    return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(balance)
  }

  return (
    <main className="dashboard-page">
      <nav className="navbar">
        <div className="brand"><span className="brand-mark">L</span>UX EXCHANGE</div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/exchange">Exchange</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout}>Log out</button>
      </nav>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h1>{user?.firstName ? `Good to see you, ${user.firstName}.` : 'Your wallets.'}</h1>
            <p className="subtitle">Your balances, all in one place.</p>
          </div>
        </header>
        {loading && <p className="loading-state">Loading your wallets...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && (
          <div className="wallet-grid">
            {currencies.map((currency) => (
              <article className="wallet-card" key={currency}>
                <div className="wallet-currency"><span>{currency}</span><span className="currency-icon">{currency[0]}</span></div>
                <div className="wallet-balance">{getBalance(currency)}</div>
                <div className="wallet-label">Available balance {currency}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard
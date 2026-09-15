import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { getTransactions } from '../services/api.js'

function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await getTransactions()
        const sortedTransactions = [...(response.transactions || [])].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        setTransactions(sortedTransactions)
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Unable to load transactions.')
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [navigate])

  const formatValue = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(Number(value || 0))
  const formatDate = (value) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-page">
      <nav className="navbar">
        <div className="brand"><span className="brand-mark">L</span>UX EXCHANGE</div>
        <div className="nav-links">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/exchange">Exchange</NavLink>
          <NavLink className="active" to="/transactions">Transactions</NavLink>
        </div>
        <button className="logout-button" type="button" onClick={logout}>Log out</button>
      </nav>
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Activity</p>
            <h1>Transaction history.</h1>
            <p className="subtitle">A record of every exchange from your account.</p>
          </div>
        </header>
        {loading && <p className="loading-state">Loading transaction history...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && transactions.length === 0 && <p className="empty-state">No transactions yet.</p>}
        {!loading && !error && transactions.length > 0 && (
          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead><tr><th>Date</th><th>Exchange</th><th>Sent</th><th>Received</th><th>Rate</th><th>Fee</th><th>Status</th></tr></thead>
              <tbody>{transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td data-label="Date">{formatDate(transaction.createdAt)}</td>
                  <td data-label="Exchange"><strong>{transaction.fromCurrency} → {transaction.toCurrency}</strong></td>
                  <td data-label="Sent">{formatValue(transaction.fromAmount)} {transaction.fromCurrency}</td>
                  <td data-label="Received">{formatValue(transaction.toAmount)} {transaction.toCurrency}</td>
                  <td data-label="Rate">{formatValue(transaction.exchangeRate)}</td>
                  <td data-label="Fee">{formatValue(transaction.fee)} {transaction.fromCurrency}</td>
                  <td data-label="Status"><span className={`status status-${String(transaction.status).toLowerCase()}`}>{transaction.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default Transactions
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { getFundingHistory } from '../services/api.js'

function FundingHistory() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await getFundingHistory()
        setTransactions(response.transactions || [])
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setError(requestError.response?.data?.message || 'Unable to load funding history.')
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [navigate])

  const formatAmount = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(Number(value || 0))
  const formatDate = (value) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content">
        <header className="dashboard-header"><div><p className="eyebrow">Funding activity</p><h1>Funding history.</h1><p className="subtitle">Your simulated deposits and withdrawals.</p></div></header>
        {loading && <p className="loading-state">Loading funding history...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && transactions.length === 0 && <div className="empty-state"><strong>No deposits or withdrawals yet.</strong><span>Your simulated funding activity will appear here.</span></div>}
        {!loading && !error && transactions.length > 0 && <div className="funding-history-wrap"><table className="funding-history-table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id}><td data-label="Date">{formatDate(transaction.createdAt)}</td><td data-label="Type"><span className={`funding-type funding-${transaction.type.toLowerCase()}`}>{transaction.type}</span></td><td data-label="Amount"><strong>{transaction.type === 'DEPOSIT' ? '+' : '-'} {formatAmount(transaction.amount)} {transaction.currency}</strong></td><td data-label="Status"><span className={`status status-${transaction.status.toLowerCase()}`}>{transaction.status}</span></td></tr>)}</tbody></table></div>}
      </section>
    </main>
  )
}

export default FundingHistory
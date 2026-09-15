import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { getWallets, withdraw } from '../services/api.js'

const currencies = ['GBP', 'EUR', 'USD', 'USDT', 'BTC']
const quickAmounts = [100, 500, 1000]

function Withdraw() {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState('GBP')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadBalance = async () => {
    try {
      const response = await getWallets()
      const wallet = response.wallets?.find((item) => item.currency === currency)
      setBalance(Number(wallet?.balance || 0))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: 'Unable to load wallet balance.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBalance()
  }, [currency])

  const numericAmount = Number(amount) || 0
  const insufficientBalance = numericAmount > balance
  const format = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(value)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (numericAmount <= 0 || insufficientBalance) return
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await withdraw({ currency, amount: numericAmount })
      setMessage({ type: 'success', text: response.message || 'Withdrawal completed.' })
      setAmount('')
      await loadBalance()
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to complete withdrawal.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content narrow-content">
        <header className="dashboard-header"><div><p className="eyebrow">Remove funds</p><h1>Withdraw funds.</h1><p className="subtitle">Reduce your simulated wallet balance.</p></div></header>
        <form className="funding-card withdraw-card" onSubmit={handleSubmit}>
          <p className="simulation-notice">Simulation only — no real bank or blockchain withdrawal occurs.</p>
          <label className="field">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="funding-balance">Available balance <strong>{loading ? 'Loading...' : `${format(balance)} ${currency}`}</strong></div>
          <label className="field">Amount<input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
          <div className="quick-amounts">{quickAmounts.map((quickAmount) => <button type="button" key={quickAmount} onClick={() => setAmount(String(quickAmount))}>{quickAmount}</button>)}</div>
          {insufficientBalance && <p className="form-error" role="alert">Insufficient {currency} balance.</p>}
          <div className="funding-summary"><span>Withdrawal summary</span><strong>{format(numericAmount)} {currency}</strong></div>
          {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
          <button className="primary-button funding-submit" type="submit" disabled={submitting || numericAmount <= 0 || insufficientBalance}>{submitting ? 'Withdrawing...' : 'Withdraw funds'}</button>
        </form>
      </section>
    </main>
  )
}

export default Withdraw
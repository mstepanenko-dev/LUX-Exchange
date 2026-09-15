import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { deposit, getWallets } from '../services/api.js'

const currencies = ['GBP', 'EUR', 'USD', 'USDT', 'BTC']
const quickAmounts = [100, 500, 1000]

function Deposit() {
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
  const format = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(value)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (numericAmount <= 0) return
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await deposit({ currency, amount: numericAmount })
      setMessage({ type: 'success', text: response.message || 'Deposit completed.' })
      setAmount('')
      await loadBalance()
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to complete deposit.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content narrow-content">
        <header className="dashboard-header"><div><p className="eyebrow">Add funds</p><h1>Deposit funds.</h1><p className="subtitle">Increase your simulated LUX wallet balance.</p></div></header>
        <form className="funding-card deposit-card" onSubmit={handleSubmit}>
          <p className="simulation-notice">Simulation only — no real funds are transferred.</p>
          <label className="field">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="funding-balance">Current balance <strong>{loading ? 'Loading...' : `${format(balance)} ${currency}`}</strong></div>
          <label className="field">Amount<input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
          <div className="quick-amounts">{quickAmounts.map((quickAmount) => <button type="button" key={quickAmount} onClick={() => setAmount(String(quickAmount))}>{quickAmount}</button>)}</div>
          <div className="funding-summary"><span>Deposit summary</span><strong>{format(numericAmount)} {currency}</strong></div>
          {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
          <button className="primary-button funding-submit" type="submit" disabled={submitting || numericAmount <= 0}>{submitting ? 'Depositing...' : 'Deposit funds'}</button>
        </form>
      </section>
    </main>
  )
}

export default Deposit
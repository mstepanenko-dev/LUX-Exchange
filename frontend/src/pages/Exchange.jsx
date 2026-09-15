import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { exchange, getRates, getWallets } from '../services/api.js'

const currencies = ['GBP', 'EUR', 'USD', 'USDT', 'BTC']

function Exchange() {
  const navigate = useNavigate()
  const [wallets, setWallets] = useState([])
  const [rates, setRates] = useState({})
  const [feePercent, setFeePercent] = useState(0.5)
  const [fromCurrency, setFromCurrency] = useState('GBP')
  const [toCurrency, setToCurrency] = useState('USDT')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadData = async () => {
    try {
      const [walletResponse, rateResponse] = await Promise.all([getWallets(), getRates()])
      setWallets(walletResponse.wallets || [])
      setRates(rateResponse.rates || {})
      setFeePercent(Number(rateResponse.feePercent ?? 0.5))
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to load exchange data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const availableBalance = Number(wallets.find((wallet) => wallet.currency === fromCurrency)?.balance || 0)
  const exchangeRate = Number(rates[fromCurrency]?.[toCurrency] || 0)
  const numericAmount = Number(amount) || 0
  const fee = numericAmount * (feePercent / 100)
  const amountAfterFee = Math.max(numericAmount - fee, 0)
  const estimatedReceive = amountAfterFee * exchangeRate
  const insufficientBalance = numericAmount > availableBalance

  const formatAmount = (value, currency) => new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: currency === 'BTC' ? 8 : 2,
  }).format(value)

  const summary = useMemo(() => ({
    rate: exchangeRate,
    fee,
    amountAfterFee,
    estimatedReceive,
  }), [exchangeRate, fee, amountAfterFee, estimatedReceive])

  const handleFromChange = (event) => {
    const nextCurrency = event.target.value
    setFromCurrency(nextCurrency)
    if (nextCurrency === toCurrency) {
      setToCurrency(currencies.find((currency) => currency !== nextCurrency))
    }
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (numericAmount <= 0 || insufficientBalance || !exchangeRate) return

    setSubmitting(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await exchange({ fromCurrency, toCurrency, amount: numericAmount })
      setMessage({ type: 'success', text: response.message || 'Exchange completed successfully.' })
      setAmount('')
      await loadData()
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Exchange could not be completed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content narrow-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Trade assets</p>
            <h1>Make an exchange.</h1>
            <p className="subtitle">Move between your LUX wallets at current rates.</p>
          </div>
        </header>
        {loading ? <p className="loading-state">Loading exchange data...</p> : (
          <form className="exchange-card" onSubmit={handleSubmit}>
            <div className="exchange-fields">
              <label className="field">From
                <select value={fromCurrency} onChange={handleFromChange}>
                  {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
                <span className="balance-hint">Available: {formatAmount(availableBalance, fromCurrency)} {fromCurrency}</span>
              </label>
              <div className="exchange-arrow" aria-hidden="true">↓</div>
              <label className="field">To
                <select value={toCurrency} onChange={(event) => setToCurrency(event.target.value)}>
                  {currencies.filter((currency) => currency !== fromCurrency).map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
            </div>
            <label className="field">Amount ({fromCurrency})
              <input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
            </label>
            {numericAmount > 0 && insufficientBalance && <p className="form-error" role="alert">Insufficient {fromCurrency} balance.</p>}
            <div className="exchange-summary">
              <div><span>Exchange rate</span><strong>1 {fromCurrency} = {formatAmount(summary.rate, toCurrency)} {toCurrency}</strong></div>
              <div><span>Fee ({feePercent}%)</span><strong>{formatAmount(summary.fee, fromCurrency)} {fromCurrency}</strong></div>
              <div><span>Amount after fee</span><strong>{formatAmount(summary.amountAfterFee, fromCurrency)} {fromCurrency}</strong></div>
              <div className="receive-total"><span>Estimated receive</span><strong>{formatAmount(summary.estimatedReceive, toCurrency)} {toCurrency}</strong></div>
            </div>
            {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={submitting || numericAmount <= 0 || insufficientBalance || !exchangeRate}>{submitting ? 'Exchanging...' : 'Exchange now'}</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default Exchange
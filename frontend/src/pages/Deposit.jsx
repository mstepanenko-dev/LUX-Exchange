import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { deposit, getPaymentMethods, getWallets } from '../services/api.js'
import { formatPaymentMethod } from '../utils/paymentMethod.js'

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
  const [paymentMethods, setPaymentMethods] = useState([])
  const [fundingMethod, setFundingMethod] = useState('card')
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [successfulDeposit, setSuccessfulDeposit] = useState(null)

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

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const response = await getPaymentMethods()
        const methods = response.paymentMethods || []
        setPaymentMethods(methods)
        setSelectedPaymentMethodId(String(methods.find((method) => method.isDefault)?.id || methods[0]?.id || ''))
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setMessage({ type: 'error', text: 'Unable to load payment methods.' })
      }
    }

    loadPaymentMethods()
  }, [navigate])

  const numericAmount = Number(amount) || 0
  const format = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(value)

  const selectedPaymentMethod = paymentMethods.find((method) => String(method.id) === selectedPaymentMethodId)
  const canConfirmDeposit = numericAmount > 0 && fundingMethod === 'card' && Boolean(selectedPaymentMethod)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canConfirmDeposit) return
    setMessage({ type: '', text: '' })
    setSuccessfulDeposit(null)
    setShowConfirmation(true)
  }

  const handleConfirmDeposit = async () => {
    if (!canConfirmDeposit) return
    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await deposit({ currency, amount: numericAmount })
      setMessage({ type: 'success', text: response.message || 'Deposit completed.' })
      setSuccessfulDeposit({ amount: numericAmount, currency, paymentMethod: selectedPaymentMethod })
      setAmount('')
      setShowConfirmation(false)
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
          <fieldset className="deposit-method-selector"><legend>Payment method</legend><label className={`deposit-method-option ${fundingMethod === 'card' ? 'selected' : ''}`}><input type="radio" name="fundingMethod" value="card" checked={fundingMethod === 'card'} onChange={(event) => setFundingMethod(event.target.value)} /><span><strong>Bank card</strong><small>Functional demo</small></span></label><label className={`deposit-method-option ${fundingMethod === 'bank-transfer' ? 'selected' : ''}`}><input type="radio" name="fundingMethod" value="bank-transfer" checked={fundingMethod === 'bank-transfer'} onChange={(event) => setFundingMethod(event.target.value)} /><span><strong>Bank transfer</strong><small>Coming soon / Demo</small></span></label><label className={`deposit-method-option ${fundingMethod === 'crypto' ? 'selected' : ''}`}><input type="radio" name="fundingMethod" value="crypto" checked={fundingMethod === 'crypto'} onChange={(event) => setFundingMethod(event.target.value)} /><span><strong>Crypto</strong><small>Coming soon / Demo</small></span></label></fieldset>
          {fundingMethod === 'card' && <div className="deposit-card-selector"><div className="deposit-section-heading"><span>Demo card</span><button className="details-button" type="button" onClick={() => navigate('/payment-methods')}>Manage cards</button></div>{paymentMethods.length === 0 ? <div className="empty-state"><strong>No demo cards added yet.</strong><button className="secondary-button" type="button" onClick={() => navigate('/payment-methods')}>Add payment method</button></div> : <div className="deposit-card-options">{paymentMethods.map((method) => <label className={`deposit-card-option ${String(method.id) === selectedPaymentMethodId ? 'selected' : ''}`} key={method.id}><input type="radio" name="selectedPaymentMethod" value={method.id} checked={String(method.id) === selectedPaymentMethodId} onChange={(event) => setSelectedPaymentMethodId(event.target.value)} /><span><strong>{formatPaymentMethod(method)}</strong><small>{method.cardholderName}</small></span>{method.isDefault && <em>Default</em>}</label>)}</div>}</div>}
          {fundingMethod !== 'card' && <p className="simulation-notice">{fundingMethod === 'crypto' ? 'Crypto funding is coming soon. Use Crypto wallets for Testnet4 activity.' : 'Bank transfer funding is coming soon in this demo.'}</p>}
          <label className="field">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <div className="funding-balance">Current balance <strong>{loading ? 'Loading...' : `${format(balance)} ${currency}`}</strong></div>
          <label className="field">Amount<input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></label>
          <div className="quick-amounts">{quickAmounts.map((quickAmount) => <button type="button" key={quickAmount} onClick={() => setAmount(String(quickAmount))}>{quickAmount}</button>)}</div>
          <div className="funding-summary"><span>Deposit summary</span><strong>{format(numericAmount)} {currency}</strong></div>
          {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
          <button className="primary-button funding-submit" type="submit" disabled={submitting || !canConfirmDeposit}>{submitting ? 'Depositing...' : 'Review deposit'}</button>
        </form>
        {message.type === 'success' && successfulDeposit && <section className="deposit-success" role="status"><strong>Deposit successful</strong><span>{format(successfulDeposit.amount)} {successfulDeposit.currency} added to your simulated wallet.</span><small>Payment method: {successfulDeposit.paymentMethod ? formatPaymentMethod(successfulDeposit.paymentMethod) : 'Demo card'}</small><button className="secondary-button" type="button" onClick={() => navigate('/funding-history')}>View funding history</button></section>}
        {showConfirmation && <div className="modal-backdrop" role="presentation"><section className="deposit-confirmation" role="dialog" aria-modal="true" aria-labelledby="deposit-confirmation-title"><div className="modal-heading"><div><p className="eyebrow">Review deposit</p><h2 id="deposit-confirmation-title">Deposit summary</h2></div><button className="modal-close" type="button" onClick={() => setShowConfirmation(false)} aria-label="Close deposit confirmation">×</button></div><div className="confirmation-summary"><div><span>Amount</span><strong>{format(numericAmount)} {currency}</strong></div><div><span>Currency</span><strong>{currency}</strong></div><div><span>Payment method</span><strong>{selectedPaymentMethod ? formatPaymentMethod(selectedPaymentMethod) : 'Demo card'}</strong></div><div><span>Fee</span><strong>£0.00</strong></div><div className="confirmation-total"><span>You receive</span><strong>{format(numericAmount)} {currency}</strong></div></div><p className="simulation-notice">Simulation only — no real funds will be charged.</p><button className="primary-button" type="button" onClick={handleConfirmDeposit} disabled={submitting}>{submitting ? 'Depositing...' : 'Confirm demo deposit'}</button></section></div>}
      </section>
    </main>
  )
}

export default Deposit
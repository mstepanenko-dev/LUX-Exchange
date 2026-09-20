import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDemoCard, deletePaymentMethod, getPaymentMethods, setDefaultPaymentMethod } from '../services/api.js'
const initialForm = {
  cardholderName: '',
  brand: 'Visa',
  last4: '',
  expiryMonth: '',
  expiryYear: '',
}

function PaymentMethods({ compact = false, onMethodsChange }) {
  const navigate = useNavigate()
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const loadPaymentMethods = async () => {
    try {
      const response = await getPaymentMethods()
      setPaymentMethods(response.paymentMethods || [])
      onMethodsChange?.(response.paymentMethods || [])
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to load payment methods.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await addDemoCard({ ...form, expiryMonth: Number(form.expiryMonth), expiryYear: Number(form.expiryYear) })
      setForm(initialForm)
      setShowForm(false)
      setMessage({ type: 'success', text: 'Demo card added.' })
      await loadPaymentMethods()
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to add demo card.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDefault = async (id) => {
    setActionId(id)
    setMessage({ type: '', text: '' })
    try {
      await setDefaultPaymentMethod(id)
      await loadPaymentMethods()
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to set default card.' })
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id) => {
    setActionId(id)
    setMessage({ type: '', text: '' })
    try {
      await deletePaymentMethod(id)
      await loadPaymentMethods()
      setMessage({ type: 'success', text: 'Payment method removed.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to remove payment method.' })
    } finally {
      setActionId(null)
    }
  }

  return (
    <section className={compact ? 'payment-methods payment-methods-compact' : 'payment-methods'}>
      {!compact && <header className="dashboard-header"><div><p className="eyebrow">Funding settings</p><h1>Payment methods.</h1><p className="subtitle">Manage demo payment methods for simulated deposits.</p></div></header>}
      <div className="simulation-notice">Simulation only — no real card or banking data is processed or stored.</div>
      <div className="payment-methods-heading"><div><h2>Saved methods</h2><span>{paymentMethods.length} demo {paymentMethods.length === 1 ? 'method' : 'methods'}</span></div><button className="primary-button" type="button" onClick={() => setShowForm(true)}>+ Add payment method</button></div>
      {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
      {loading ? <div className="skeleton-card payment-method-loading" aria-label="Loading payment methods"><span className="skeleton skeleton-line skeleton-line-wide" /><span className="skeleton skeleton-balance" /></div> : paymentMethods.length === 0 ? <div className="empty-state"><strong>No demo payment methods yet.</strong><span>Add a demo card to use it for simulated deposits.</span></div> : <div className="payment-method-grid">{paymentMethods.map((paymentMethod) => <article className={`demo-card ${paymentMethod.isDefault ? 'demo-card-default' : ''}`} key={paymentMethod.id}><div className="demo-card-top"><span className="demo-card-brand">{paymentMethod.brand}</span>{paymentMethod.isDefault && <span className="default-badge">Default</span>}</div><strong className="demo-card-number">•••• •••• •••• {paymentMethod.last4}</strong><div className="demo-card-bottom"><span>{paymentMethod.cardholderName}</span><span>Expires {String(paymentMethod.expiryMonth).padStart(2, '0')}/{String(paymentMethod.expiryYear).slice(-2)}</span></div><div className="demo-card-actions">{!paymentMethod.isDefault && <button className="secondary-button" type="button" onClick={() => handleDefault(paymentMethod.id)} disabled={actionId === paymentMethod.id}>{actionId === paymentMethod.id ? 'Saving...' : 'Set as default'}</button>}<button className="details-button" type="button" onClick={() => handleDelete(paymentMethod.id)} disabled={actionId === paymentMethod.id}>{actionId === paymentMethod.id ? 'Removing...' : 'Remove'}</button></div></article>)}</div>}
      {!compact && <div className="payment-method-coming-soon"><strong>More ways to fund</strong><span>Bank transfer and crypto funding are coming soon in this demo.</span></div>}
      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}><section className="demo-card-modal" role="dialog" aria-modal="true" aria-labelledby="add-demo-card-title"><div className="modal-heading"><div><p className="eyebrow">Demo funding</p><h2 id="add-demo-card-title">Add a demo card</h2></div><button className="modal-close" type="button" onClick={() => setShowForm(false)} aria-label="Close add demo card">×</button></div><p className="modal-helper">For security, LUX Exchange demo stores only the card brand, last four digits, and expiry.</p><form className="settings-form" onSubmit={handleAdd}><label className="field">Cardholder name<input name="cardholderName" value={form.cardholderName} onChange={handleChange} placeholder="John Smith" maxLength="100" required /></label><div className="form-grid"><label className="field">Card brand<select name="brand" value={form.brand} onChange={handleChange}><option>Visa</option><option>Mastercard</option></select></label><label className="field">Last 4 digits<input name="last4" value={form.last4} onChange={handleChange} inputMode="numeric" pattern="[0-9]{4}" maxLength="4" placeholder="4242" required /></label></div><div className="form-grid"><label className="field">Expiry month<input name="expiryMonth" type="number" min="1" max="12" value={form.expiryMonth} onChange={handleChange} placeholder="12" required /></label><label className="field">Expiry year<input name="expiryYear" type="number" min={new Date().getFullYear()} value={form.expiryYear} onChange={handleChange} placeholder="2029" required /></label></div><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Adding card...' : 'Add demo card'}</button></form></section></div>}
    </section>
  )
}

export default PaymentMethods

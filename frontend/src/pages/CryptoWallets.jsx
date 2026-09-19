import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { createBtcTestnet4Wallet, getBtcTestnet4Status, getCryptoWallets, previewBtcTestnet4Send, sendBtcTestnet4 } from '../services/api.js'

const BLOCKCHAIN_ERROR = 'Bitcoin Testnet4 data is temporarily unavailable.'

function CryptoWallets() {
  const navigate = useNavigate()
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [copied, setCopied] = useState(false)
  const [blockchainStatus, setBlockchainStatus] = useState(null)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  const [blockchainError, setBlockchainError] = useState(false)
  const [recipient, setRecipient] = useState('')
  const [amountBTC, setAmountBTC] = useState('0.00000100')
  const [sending, setSending] = useState(false)
  const [broadcastTransaction, setBroadcastTransaction] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewInput, setPreviewInput] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [expandedTransaction, setExpandedTransaction] = useState(null)
  const [copiedItem, setCopiedItem] = useState('')

  const loadWallet = async () => {
    try {
      const response = await getCryptoWallets()
      setWallet(response.wallets?.find((item) => item.currency === 'BTC' && item.network === 'bitcoin-testnet4') || null)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to load crypto wallets.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

  const loadBlockchainStatus = async () => {
    if (!wallet?.address) return

    setBlockchainLoading(true)
    setBlockchainError(false)
    try {
      const response = await getBtcTestnet4Status()
      setBlockchainStatus(response)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setBlockchainStatus(null)
      setBlockchainError(true)
    } finally {
      setBlockchainLoading(false)
    }
  }

  useEffect(() => {
    if (wallet) {
      loadBlockchainStatus()
    }
  }, [wallet?.address])

  const handleCreate = async () => {
    setCreating(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await createBtcTestnet4Wallet()
      setWallet(response.wallet)
      setMessage({ type: 'success', text: 'Bitcoin Testnet4 wallet ready.' })
    } catch (requestError) {
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to create testnet wallet.' })
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const handleCopyValue = async (value, item) => {
    await navigator.clipboard.writeText(value)
    setCopiedItem(item)
    window.setTimeout(() => setCopiedItem(''), 1800)
  }

  const invalidatePreview = () => {
    setPreview(null)
    setPreviewInput(null)
  }

  const handleRecipientChange = (event) => {
    setRecipient(event.target.value)
    invalidatePreview()
  }

  const handleAmountChange = (event) => {
    setAmountBTC(event.target.value)
    invalidatePreview()
  }

  const handlePreview = async () => {
    setPreviewing(true)
    setMessage({ type: '', text: '' })
    try {
      const request = { toAddress: recipient.trim(), amountBTC }
      const response = await previewBtcTestnet4Send(request)
      setPreview(response.preview)
      setPreviewInput(request)
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setPreview(null)
      setPreviewInput(null)
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to preview Testnet4 transaction.' })
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async (event) => {
    event.preventDefault()
    const trimmedRecipient = recipient.trim()
    if (!preview || previewInput?.toAddress !== trimmedRecipient || previewInput?.amountBTC !== amountBTC) return
    const confirmation = window.confirm(`Amount: ${formatBTC(preview.amountBTC)} BTC\nEstimated fee: ${formatBTC(preview.estimatedFeeBTC)} BTC\nTotal spend: ${formatBTC(preview.totalSpendBTC)} BTC\nChange: ${formatBTC(preview.changeBTC)} BTC\n\nSend to: ${trimmedRecipient}\n\nThis Testnet4 transaction cannot be reversed.`)
    if (!confirmation) return

    setSending(true)
    setMessage({ type: '', text: '' })
    setBroadcastTransaction(null)
    try {
      const response = await sendBtcTestnet4({ toAddress: trimmedRecipient, amountBTC })
      setBroadcastTransaction(response.transaction)
      setRecipient('')
      setAmountBTC('0.00000100')
      invalidatePreview()
      await loadBlockchainStatus()
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to send Testnet4 BTC.' })
    } finally {
      setSending(false)
    }
  }

  const formatBTC = (value) => Number(value || 0).toFixed(8)
  const formatTransactionDate = (value) => value
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : 'Unconfirmed'
  const getTransactionStatus = (confirmations) => confirmations === 0
    ? 'Pending'
    : confirmations <= 5
      ? 'Confirming'
      : 'Confirmed'
  const isPreviewCurrent = preview && previewInput?.toAddress === recipient.trim() && previewInput?.amountBTC === amountBTC

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content narrow-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Digital assets</p>
            <h1>Crypto wallets.</h1>
            <p className="subtitle">A public address for your LUX portfolio demo.</p>
          </div>
        </header>
        <section className="crypto-wallet-page" aria-label="Bitcoin Testnet4 wallet">
          {loading ? <p className="loading-state">Loading crypto wallets...</p> : (
            <article className="crypto-wallet-card">
              <div className="crypto-wallet-heading">
                <div>
                  <p className="eyebrow">Bitcoin</p>
                  <h2>BTC</h2>
                  <p className="crypto-network">Network: Bitcoin Testnet4</p>
                </div>
                <div className="currency-icon crypto-icon">B</div>
              </div>
              {!wallet ? <button className="primary-button" type="button" onClick={handleCreate} disabled={creating}>{creating ? 'Creating wallet...' : 'Create testnet wallet'}</button> : (
                <div className="crypto-wallet-address">
                  <div className="crypto-wallet-qr"><QRCodeSVG value={wallet.address} size={128} bgColor="#f4f0ff" fgColor="#17151f" /></div>
                  <div className="crypto-address-content">
                    <span>Testnet address</span>
                    <strong>{wallet.address}</strong>
                    <button className="funding-action deposit-action" type="button" onClick={handleCopy}>{copied ? 'Copied' : 'Copy address'}</button>
                  </div>
                </div>
              )}
              <p className="crypto-notice">Testnet4 only — do not send real BTC to this address.</p>
              <p className="crypto-description">This wallet is for development and portfolio demonstration only.</p>
            </article>
          )}
          {wallet && (
            <section className="btc-send-panel" aria-label="Send Bitcoin Testnet4">
              <div className="send-panel-heading">
                <div>
                  <p className="eyebrow">On-chain transfer</p>
                  <h2>Send Testnet4 BTC</h2>
                </div>
                <span className="testnet-badge">TESTNET4</span>
              </div>
              <p className="send-warning">Testnet4 only — this sends test BTC and has no real monetary value.</p>
              <div className="send-balance-row"><span>Confirmed spendable balance</span><strong>{formatBTC(blockchainStatus?.balance?.confirmedBTC)} BTC</strong></div>
              <form className="btc-send-form" onSubmit={handleSend}>
                <label className="field">
                  Recipient address
                  <input type="text" value={recipient} onChange={handleRecipientChange} placeholder="tb1q..." autoComplete="off" required />
                </label>
                <label className="field">
                  Amount BTC
                  <input type="number" min="0.00000547" step="0.00000001" value={amountBTC} onChange={handleAmountChange} placeholder="0.00000100" required />
                </label>
                <p className="send-fee-note">Network fee is estimated from current Testnet4 conditions and deducted from confirmed UTXOs.</p>
                <button className="secondary-button preview-button" type="button" onClick={handlePreview} disabled={previewing || !recipient.trim() || Number(amountBTC) <= 0}>{previewing ? 'Calculating...' : 'Preview transaction'}</button>
                {isPreviewCurrent && (
                  <div className="transaction-preview-card">
                    <h3>Transaction preview</h3>
                    <div className="preview-row"><span>Send amount</span><strong>{formatBTC(preview.amountBTC)} BTC</strong></div>
                    <div className="preview-row"><span>Estimated network fee</span><strong>{formatBTC(preview.estimatedFeeBTC)} BTC</strong></div>
                    <div className="preview-row"><span>Total spend</span><strong>{formatBTC(preview.totalSpendBTC)} BTC</strong></div>
                    <div className="preview-row"><span>Change</span><strong>{formatBTC(preview.changeBTC)} BTC</strong></div>
                    <div className="preview-row"><span>Fee rate</span><strong>{preview.feeRateSatVb} sat/vB</strong></div>
                    {!preview.changeOutput && <p className="dust-warning">Remaining change is below the dust threshold and will be added to the network fee.</p>}
                  </div>
                )}
                <button className="primary-button send-button" type="submit" disabled={sending || blockchainLoading || !isPreviewCurrent}>{sending ? 'Broadcasting...' : 'Send Testnet4 BTC'}</button>
              </form>
              {broadcastTransaction && (
                <div className="transaction-success-panel" role="status">
                  <strong>Transaction broadcast successfully</strong>
                  <div className="detail-row"><span>TXID</span><code>{broadcastTransaction.txid}</code><button type="button" className="copy-button" onClick={() => handleCopyValue(broadcastTransaction.txid, 'txid')}>{copiedItem === 'txid' ? 'Copied' : 'Copy'}</button></div>
                  <div className="detail-row"><span>From</span><code>{broadcastTransaction.from}</code></div>
                  <div className="detail-row"><span>To</span><code>{broadcastTransaction.to}</code><button type="button" className="copy-button" onClick={() => handleCopyValue(broadcastTransaction.to, 'recipient')}>{copiedItem === 'recipient' ? 'Copied' : 'Copy'}</button></div>
                  <div className="detail-row"><span>Amount</span><strong>{formatBTC(broadcastTransaction.amountBTC)} BTC</strong></div>
                  <div className="detail-row"><span>Network fee</span><strong>{formatBTC(broadcastTransaction.feeBTC)} BTC</strong></div>
                  <div className="detail-row"><span>Network</span><strong>Bitcoin Testnet4</strong></div>
                  <div className="detail-row"><span>Status</span><strong>Pending</strong></div>
                  <a href={`https://mempool.space/testnet4/tx/${broadcastTransaction.txid}`} target="_blank" rel="noreferrer">View on mempool.space</a>
                </div>
              )}
            </section>
          )}
          {wallet && (
            <section className="blockchain-panel" aria-label="Bitcoin Testnet4 blockchain data">
              <div className="blockchain-panel-heading">
                <div>
                  <p className="eyebrow">Live network data</p>
                  <h2>Bitcoin Testnet4</h2>
                </div>
                <button className="refresh-button" type="button" onClick={loadBlockchainStatus} disabled={blockchainLoading}>
                  {blockchainLoading ? 'Refreshing...' : 'Refresh blockchain data'}
                </button>
              </div>
              {blockchainLoading && !blockchainStatus && <p className="loading-state">Checking Testnet4 blockchain...</p>}
              {blockchainError && <p className="blockchain-error" role="status">{BLOCKCHAIN_ERROR}</p>}
              {blockchainStatus && !blockchainError && (
                <>
                  <div className="blockchain-balance-grid">
                    <div className="blockchain-balance-total"><span>Balance</span><strong>{formatBTC(blockchainStatus.balance.totalBTC)} BTC</strong></div>
                    <div><span>Confirmed</span><strong>{formatBTC(blockchainStatus.balance.confirmedBTC)} BTC</strong></div>
                    <div><span>Unconfirmed</span><strong>{formatBTC(blockchainStatus.balance.unconfirmedBTC)} BTC</strong></div>
                  </div>
                  <div className="transaction-list">
                    <div className="transaction-list-heading"><h3>Recent transactions</h3><span>{blockchainStatus.transactions.length} total</span></div>
                    {blockchainStatus.transactions.length === 0 ? <p className="transaction-empty">No Testnet4 transactions found for this address.</p> : blockchainStatus.transactions.map((transaction) => (
                      <article className="blockchain-transaction" key={transaction.txid}>
                        <div className="transaction-main">
                          <div className="transaction-direction"><span className={transaction.direction === 'received' ? 'received-amount' : 'sent-amount'}>{transaction.direction === 'received' ? 'Received' : transaction.direction === 'sent' ? 'Sent' : 'Self transfer'}</span><strong className={transaction.direction === 'received' ? 'received-amount' : 'sent-amount'}>{transaction.netAmountBTC > 0 ? '+' : ''}{formatBTC(transaction.netAmountBTC)} BTC</strong></div>
                          <a className="transaction-hash" href={`https://mempool.space/testnet4/tx/${transaction.txid}`} target="_blank" rel="noreferrer">{transaction.txid.slice(0, 12)}...</a>
                          <button className="details-button" type="button" onClick={() => setExpandedTransaction(expandedTransaction === transaction.txid ? null : transaction.txid)}>{expandedTransaction === transaction.txid ? 'Hide details' : 'Details'}</button>
                        </div>
                        <div className="transaction-meta"><span className={`transaction-status status-${getTransactionStatus(transaction.confirmations).toLowerCase()}`}>{getTransactionStatus(transaction.confirmations)}</span><span>{transaction.confirmations} confirmations</span><span>{formatTransactionDate(transaction.blockTime)}</span></div>
                        {expandedTransaction === transaction.txid && (
                          <div className="transaction-details">
                            <div><span>TXID</span><code>{transaction.txid}</code></div>
                            <div><span>Direction</span><strong>{transaction.direction}</strong></div>
                            <div><span>Net amount</span><strong>{formatBTC(transaction.netAmountBTC)} BTC</strong></div>
                            <div><span>Confirmations</span><strong>{transaction.confirmations}</strong></div>
                            <div><span>Block time</span><strong>{formatTransactionDate(transaction.blockTime)}</strong></div>
                            <div><span>Status</span><strong>{getTransactionStatus(transaction.confirmations)}</strong></div>
                            <a href={`https://mempool.space/testnet4/tx/${transaction.txid}`} target="_blank" rel="noreferrer">View full transaction</a>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
          {message.text && <p className={`${message.type}-alert`} role="status">{message.text}</p>}
        </section>
      </section>
    </main>
  )
}

export default CryptoWallets
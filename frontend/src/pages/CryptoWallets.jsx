import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { createBtcTestnet4Wallet, getBtcTestnet4Status, getCryptoWallets } from '../services/api.js'

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

  const formatBTC = (value) => Number(value || 0).toFixed(8)
  const formatTransactionDate = (value) => value
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : 'Unconfirmed'
  const getTransactionStatus = (confirmations) => confirmations === 0
    ? 'Pending'
    : confirmations <= 5
      ? 'Confirming'
      : 'Confirmed'

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
                        </div>
                        <div className="transaction-meta"><span className={`transaction-status status-${getTransactionStatus(transaction.confirmations).toLowerCase()}`}>{getTransactionStatus(transaction.confirmations)}</span><span>{transaction.confirmations} confirmations</span><span>{formatTransactionDate(transaction.blockTime)}</span></div>
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
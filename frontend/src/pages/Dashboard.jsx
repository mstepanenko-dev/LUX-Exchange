import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import PortfolioChart from '../components/PortfolioChart.jsx'
import { getPortfolio, getPortfolioHistory, getWallets } from '../services/api.js'

const currencies = ['GBP', 'EUR', 'USD', 'USDT', 'BTC']

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [portfolio, setPortfolio] = useState(null)
  const [portfolioLoading, setPortfolioLoading] = useState(true)
  const [portfolioWarning, setPortfolioWarning] = useState(false)
  const [historyRange, setHistoryRange] = useState('24h')
  const [historySnapshots, setHistorySnapshots] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
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

    const loadPortfolio = async () => {
      try {
        const response = await getPortfolio()
        setPortfolio(response)
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        if (requestError.response?.status === 503) {
          setPortfolioWarning(true)
        }
      } finally {
        setPortfolioLoading(false)
      }
    }

    const loadHistory = async () => {
      try {
        const response = await getPortfolioHistory(historyRange)
        setHistorySnapshots(response.snapshots || [])
        setHistoryError(false)
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setHistoryError(true)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadWallets()
    loadPortfolio()
    loadHistory()
  }, [historyRange, navigate])

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

  const formatBalance = (value) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 8 }).format(Number(value || 0))
  const formatGBP = (value) => new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

  const firstSnapshot = historySnapshots[0]
  const lastSnapshot = historySnapshots[historySnapshots.length - 1]
  const portfolioChange = historySnapshots.length >= 2
    ? Number(lastSnapshot.totalGBP) - Number(firstSnapshot.totalGBP)
    : 0
  const portfolioChangePercent = historySnapshots.length >= 2 && Number(firstSnapshot.totalGBP) !== 0
    ? (portfolioChange / Number(firstSnapshot.totalGBP)) * 100
    : 0
  const formatChange = (value) => `${value > 0 ? '+' : ''}${formatGBP(value)}`

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h1>{user?.firstName ? `Good to see you, ${user.firstName}.` : 'Your wallets.'}</h1>
            <p className="subtitle">Your balances, all in one place.</p>
          </div>
        </header>
        <section className="portfolio-section" aria-label="Portfolio valuation">
          <div className="portfolio-hero">
            <div>
              <div className="portfolio-label">Total portfolio value <span className="live-badge">Live valuation</span></div>
              {portfolioLoading ? <p className="portfolio-total portfolio-loading">Loading...</p> : portfolio && <p className="portfolio-total">{formatGBP(portfolio.totalGBP)}</p>}
              {portfolioWarning && <p className="portfolio-warning" role="status">Live portfolio valuation is temporarily unavailable</p>}
            </div>
            <div className="portfolio-hero-side"><div className="portfolio-symbol">£</div><div className="portfolio-actions"><button type="button" className="funding-action deposit-action" onClick={() => navigate('/deposit')}>Deposit</button><button type="button" className="funding-action withdraw-action" onClick={() => navigate('/withdraw')}>Withdraw</button></div></div>
          </div>
          {portfolio?.assets?.length > 0 && (
            <div className="asset-breakdown">
              <div className="section-heading"><h2>Asset breakdown</h2><span>Value in GBP</span></div>
              <div className="asset-grid">
                {portfolio.assets.map((asset) => (
                  <article className="asset-item" key={asset.currency}>
                    <div className="asset-heading"><span className="currency-icon">{asset.currency[0]}</span><strong>{asset.currency}</strong></div>
                    <div><span>Balance</span><strong>{formatBalance(asset.balance)}</strong></div>
                    <div><span>Value</span><strong>{formatGBP(asset.valueGBP)}</strong></div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
        <section className="portfolio-history-section" aria-label="Portfolio performance">
          <div className="section-heading portfolio-history-heading">
            <div><p className="eyebrow">Portfolio performance</p><h2>Portfolio change</h2></div>
            <div className="range-selector" role="group" aria-label="Portfolio history range">
              {['24h', '7d', '30d', 'all'].map((range) => <button key={range} type="button" className={historyRange === range ? 'active' : ''} onClick={() => { setHistoryRange(range); setHistoryLoading(true) }}>{range === 'all' ? 'ALL' : range.toUpperCase()}</button>)}
            </div>
          </div>
          {historyLoading && <p className="loading-state">Loading portfolio history...</p>}
          {!historyLoading && historyError && <p className="history-error" role="status">Portfolio history is temporarily unavailable.</p>}
          {!historyLoading && !historyError && historySnapshots.length < 2 && <p className="history-empty">Portfolio history will appear as your account activity is recorded.</p>}
          {!historyLoading && !historyError && historySnapshots.length >= 2 && <>
            <div className="portfolio-change-summary">
              <div><span>Start value</span><strong>{formatGBP(firstSnapshot.totalGBP)}</strong></div>
              <div><span>Current value</span><strong>{formatGBP(lastSnapshot.totalGBP)}</strong></div>
              <div className={portfolioChange > 0 ? 'change-positive' : portfolioChange < 0 ? 'change-negative' : 'change-neutral'}><span>Change in GBP</span><strong>{formatChange(portfolioChange)}</strong></div>
              <div className={portfolioChange > 0 ? 'change-positive' : portfolioChange < 0 ? 'change-negative' : 'change-neutral'}><span>Change %</span><strong>{portfolioChangePercent > 0 ? '+' : ''}{portfolioChangePercent.toFixed(2)}%</strong></div>
            </div>
            <PortfolioChart snapshots={historySnapshots} />
          </>}
        </section>
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
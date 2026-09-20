import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const moreRef = useRef(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const moreActive = ['/funding-history', '/payment-methods'].includes(location.pathname)

  const logout = () => {
    setMobileOpen(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const closeMenus = () => {
    setMoreOpen(false)
    setMobileOpen(false)
  }

  const linkClass = ({ isActive }) => (isActive ? 'active' : undefined)

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <NavLink className="brand" to="/dashboard" aria-label="LUX Exchange dashboard"><span className="brand-mark">L</span>UX EXCHANGE</NavLink>
      </div>
      <div className="nav-primary">
        <NavLink className={linkClass} to="/dashboard">Dashboard</NavLink>
        <NavLink className={linkClass} to="/exchange">Exchange</NavLink>
        <NavLink className={linkClass} to="/transactions">Transactions</NavLink>
        <NavLink className={linkClass} to="/crypto-wallets">Crypto wallets</NavLink>
        <NavLink className={linkClass} to="/deposit">Deposit</NavLink>
        <NavLink className={linkClass} to="/withdraw">Withdraw</NavLink>
      </div>
      <div className="nav-actions">
        <div className="more-menu" ref={moreRef}>
          <button className={`more-button ${moreActive ? 'active' : ''}`} type="button" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>More <ChevronDown size={14} aria-hidden="true" /></button>
          {moreOpen && <div className="more-dropdown" role="menu"><NavLink className={linkClass} role="menuitem" to="/funding-history" onClick={closeMenus}>Funding history</NavLink><NavLink className={linkClass} role="menuitem" to="/payment-methods" onClick={closeMenus}>Payment methods</NavLink></div>}
        </div>
        <NavLink className={linkClass} to="/profile">Profile</NavLink>
        <button className="logout-button" type="button" onClick={logout}>Log out</button>
        <button className="mobile-menu-toggle" type="button" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button>
      </div>
      {mobileOpen && <div className="mobile-menu" role="menu"><NavLink className={linkClass} role="menuitem" to="/dashboard" onClick={closeMenus}>Dashboard</NavLink><NavLink className={linkClass} role="menuitem" to="/exchange" onClick={closeMenus}>Exchange</NavLink><NavLink className={linkClass} role="menuitem" to="/transactions" onClick={closeMenus}>Transactions</NavLink><NavLink className={linkClass} role="menuitem" to="/crypto-wallets" onClick={closeMenus}>Crypto wallets</NavLink><NavLink className={linkClass} role="menuitem" to="/deposit" onClick={closeMenus}>Deposit</NavLink><NavLink className={linkClass} role="menuitem" to="/withdraw" onClick={closeMenus}>Withdraw</NavLink><NavLink className={linkClass} role="menuitem" to="/funding-history" onClick={closeMenus}>Funding history</NavLink><NavLink className={linkClass} role="menuitem" to="/payment-methods" onClick={closeMenus}>Payment methods</NavLink><NavLink className={linkClass} role="menuitem" to="/profile" onClick={closeMenus}>Profile</NavLink><button className="mobile-logout" type="button" role="menuitem" onClick={logout}>Log out</button></div>}
    </nav>
  )
}

export default Navigation
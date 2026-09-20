import { NavLink, useNavigate } from 'react-router-dom'

function Navigation() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <nav className="navbar">
      <NavLink className="brand" to="/dashboard" aria-label="LUX Exchange dashboard"><span className="brand-mark">L</span>UX EXCHANGE</NavLink>
      <div className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/exchange">Exchange</NavLink>
        <NavLink to="/transactions">Transactions</NavLink>
        <NavLink to="/crypto-wallets">Crypto wallets</NavLink>
        <NavLink to="/deposit">Deposit</NavLink>
        <NavLink to="/withdraw">Withdraw</NavLink>
        <NavLink className="nav-secondary" to="/funding-history">Funding history</NavLink>
        <NavLink className="nav-secondary" to="/profile">Profile</NavLink>
      </div>
      <button className="logout-button" type="button" onClick={logout}>Log out</button>
    </nav>
  )
}

export default Navigation
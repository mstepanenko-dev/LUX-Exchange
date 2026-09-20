import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Exchange from './pages/Exchange.jsx'
import Deposit from './pages/Deposit.jsx'
import FundingHistory from './pages/FundingHistory.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Transactions from './pages/Transactions.jsx'
import Withdraw from './pages/Withdraw.jsx'
import CryptoWallets from './pages/CryptoWallets.jsx'
import Profile from './pages/Profile.jsx'
import NotFound from './pages/NotFound.jsx'
import PaymentMethodsPage from './pages/PaymentMethodsPage.jsx'
import './App.css'

function PageTitle() {
  const location = useLocation()

  useEffect(() => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/exchange': 'Exchange',
      '/deposit': 'Deposit',
      '/withdraw': 'Withdraw',
      '/transactions': 'Transactions',
      '/funding-history': 'Funding History',
      '/crypto-wallets': 'Crypto Wallets',
      '/profile': 'Profile',
      '/payment-methods': 'Payment Methods',
      '/login': 'Sign In',
      '/register': 'Create Account',
    }
    document.title = `${titles[location.pathname] || 'Page Not Found'} | LUX Exchange`
  }, [location.pathname])

  return null
}

function ProtectedRoute({ children }) {
  return localStorage.getItem('token')
    ? <div className="app-shell">{children}<Footer /></div>
    : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exchange"
          element={
            <ProtectedRoute>
              <Exchange />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
        <Route path="/funding-history" element={<ProtectedRoute><FundingHistory /></ProtectedRoute>} />
        <Route path="/crypto-wallets" element={<ProtectedRoute><CryptoWallets /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

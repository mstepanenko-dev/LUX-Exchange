import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Exchange from './pages/Exchange.jsx'
import Deposit from './pages/Deposit.jsx'
import FundingHistory from './pages/FundingHistory.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Transactions from './pages/Transactions.jsx'
import Withdraw from './pages/Withdraw.jsx'
import CryptoWallets from './pages/CryptoWallets.jsx'
import './App.css'

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

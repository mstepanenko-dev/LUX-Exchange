import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData)
  return data
}

export const getWallets = async () => {
  const { data } = await api.get('/wallets')
  return data
}

export const getPortfolio = async () => {
  const { data } = await api.get('/portfolio')
  return data
}

export const getPortfolioHistory = async (range = '24h') => {
  const { data } = await api.get(`/portfolio/history?range=${range}`)
  return data
}

export const clearPortfolioHistory = async () => {
  const { data } = await api.delete('/dev/portfolio-history')
  return data
}

export const getRates = async () => {
  const { data } = await api.get('/rates')
  return data
}

export const exchange = async (exchangeData) => {
  const { data } = await api.post('/exchange', exchangeData)
  return data
}

export const getTransactions = async () => {
  const { data } = await api.get('/transactions')
  return data
}

export const deposit = async (fundingData) => {
  const { data } = await api.post('/funding/deposit', fundingData)
  return data
}

export const withdraw = async (fundingData) => {
  const { data } = await api.post('/funding/withdraw', fundingData)
  return data
}

export const getFundingHistory = async () => {
  const { data } = await api.get('/funding/history')
  return data
}

export const getCryptoWallets = async () => {
  const { data } = await api.get('/crypto-wallets')
  return data
}

export const createBtcTestnet4Wallet = async () => {
  const { data } = await api.post('/crypto-wallets/btc-testnet4')
  return data
}

export const getBtcTestnet4Status = async () => {
  const { data } = await api.get('/crypto-wallets/btc-testnet4/status')
  return data
}

export default api
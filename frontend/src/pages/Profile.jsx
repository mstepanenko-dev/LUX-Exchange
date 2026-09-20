import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation.jsx'
import { changePassword, getProfile, updateProfile } from '../services/api.js'

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [loading, setLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({})

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile()
        setProfile(response.user)
        setProfileForm({
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
        })
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login', { replace: true })
          return
        }
        setProfileMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to load your profile.' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  const handleProfileChange = (event) => {
    setProfileForm({ ...profileForm, [event.target.name]: event.target.value })
  }

  const handlePasswordChange = (event) => {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value })
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setProfileMessage({ type: '', text: '' })
    setProfileSaving(true)

    try {
      const response = await updateProfile(profileForm)
      setProfile(response.user)
      localStorage.setItem('user', JSON.stringify(response.user))
      setProfileMessage({ type: 'success', text: 'Profile saved.' })
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setProfileMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to save your profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordMessage({ type: '', text: '' })
    setPasswordSaving(true)

    try {
      const response = await changePassword(passwordForm)
      setPasswordForm(emptyPasswordForm)
      setPasswordMessage({ type: 'success', text: response.message || 'Password changed successfully.' })
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
        return
      }
      setPasswordMessage({ type: 'error', text: requestError.response?.data?.message || 'Unable to change your password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const togglePassword = (field) => {
    setVisiblePasswords({ ...visiblePasswords, [field]: !visiblePasswords[field] })
  }

  const formatDate = (value) => value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value))
    : '—'

  if (loading) {
    return <main className="dashboard-page"><Navigation /><section className="dashboard-content"><div className="skeleton-card profile-loading-card" aria-label="Loading profile"><span className="skeleton skeleton-line skeleton-line-wide" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-chart" /></div></section></main>
  }

  return (
    <main className="dashboard-page">
      <Navigation />
      <section className="dashboard-content profile-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Account settings</p>
            <h1>Your profile.</h1>
            <p className="subtitle">Manage your personal details and account security.</p>
          </div>
        </header>

        {profileMessage.type === 'error' && <p className="error-alert" role="alert">{profileMessage.text}</p>}
        <div className="profile-layout">
          <aside className="account-summary-card">
            <div className="account-summary-heading"><span className="account-avatar">{(profile?.firstName || profile?.email || 'L')[0].toUpperCase()}</span><div><p className="eyebrow">Account</p><h2>Account summary</h2></div></div>
            <dl className="account-summary-list">
              <div><dt>Account ID</dt><dd>{profile?.id}</dd></div>
              <div><dt>Email</dt><dd>{profile?.email}</dd></div>
              <div><dt>Joined</dt><dd>{formatDate(profile?.createdAt)}</dd></div>
              <div><dt>Status</dt><dd className="account-status">Active</dd></div>
            </dl>
          </aside>

          <div className="profile-sections">
            <section className="settings-card">
              <div className="settings-heading"><div><p className="eyebrow">Profile</p><h2>Personal details</h2></div><span>Visible on your account</span></div>
              <form className="settings-form" onSubmit={handleProfileSubmit}>
                <div className="form-grid"><label className="field">First name<input name="firstName" value={profileForm.firstName} onChange={handleProfileChange} maxLength="80" autoComplete="given-name" /></label><label className="field">Last name<input name="lastName" value={profileForm.lastName} onChange={handleProfileChange} maxLength="80" autoComplete="family-name" /></label></div>
                <div className="profile-readonly-grid"><label className="field">Email<input className="readonly-field" value={profile?.email || ''} readOnly /></label><label className="field">Member since<input className="readonly-field" value={formatDate(profile?.createdAt)} readOnly /></label></div>
                {profileMessage.type === 'success' && <p className="success-alert" role="status">{profileMessage.text}</p>}
                <button className="primary-button settings-button" type="submit" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save profile'}</button>
              </form>
            </section>

            <section className="settings-card security-card">
              <div className="settings-heading"><div><p className="eyebrow">Security</p><h2>Change password</h2></div><span>Keep your account protected</span></div>
              <form className="settings-form" onSubmit={handlePasswordSubmit}>
                {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => {
                  const labels = { currentPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password' }
                  const autocomplete = { currentPassword: 'current-password', newPassword: 'new-password', confirmPassword: 'new-password' }
                  return <label className="field" key={field}>{labels[field]}<span className="password-input-wrap"><input name={field} type={visiblePasswords[field] ? 'text' : 'password'} value={passwordForm[field]} onChange={handlePasswordChange} required autoComplete={autocomplete[field]} minLength={field === 'newPassword' ? 8 : undefined} /><button type="button" className="password-toggle" onClick={() => togglePassword(field)} aria-label={`${visiblePasswords[field] ? 'Hide' : 'Show'} ${labels[field].toLowerCase()}`}>{visiblePasswords[field] ? 'Hide' : 'Show'}</button></span></label>
                })}
                {passwordMessage.type === 'error' && <p className="error-alert" role="alert">{passwordMessage.text}</p>}
                {passwordMessage.type === 'success' && <p className="success-alert" role="status">{passwordMessage.text}</p>}
                <button className="primary-button settings-button" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Changing password...' : 'Change password'}</button>
              </form>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Profile

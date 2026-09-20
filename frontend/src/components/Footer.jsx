import { AtSign, BriefcaseBusiness, Code2, Send } from 'lucide-react'
import { socialLinks } from '../config/socialLinks.js'

const socialItems = [
  { key: 'github', label: 'Open LUX Exchange GitHub', name: 'GitHub', Icon: Code2 },
  { key: 'telegram', label: 'Open Telegram', name: 'Telegram', Icon: Send },
  { key: 'twitter', label: 'Open X', name: 'X', Icon: AtSign },
  { key: 'linkedin', label: 'Open LinkedIn', name: 'LinkedIn', Icon: BriefcaseBusiness },
]

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <span className="footer-logo"><span className="brand-mark">L</span>UX <span className="footer-dot">•</span> EXCHANGE</span>
        <span>© 2026 LUX Exchange</span>
      </div>
      <div className="site-footer-note">
        <strong>Built for portfolio demonstration</strong>
        <span>React • Node.js • PostgreSQL • Bitcoin Testnet4</span>
      </div>
      <nav className="social-links" aria-label="Project social links">
        {socialItems.map(({ key, label, name, Icon }) => (
          <a
            className="social-link"
            href={socialLinks[key]}
            key={key}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={name}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
          </a>
        ))}
      </nav>
    </footer>
  )
}

export default Footer

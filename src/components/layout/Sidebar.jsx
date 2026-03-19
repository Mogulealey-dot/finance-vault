import styles from './Sidebar.module.css'
import { APP_NAME } from '../../config/constants'

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',       icon: '📊' },
  { id: 'transactions',  label: 'Transactions',     icon: '💸' },
  { id: 'budget',        label: 'Budget',           icon: '🎯' },
  { id: 'accounts',      label: 'Accounts',         icon: '🏦' },
  { id: 'investments',   label: 'Investments',      icon: '📈' },
  { id: 'bills',         label: 'Bills & Subs',     icon: '🔄' },
  { id: 'reports',       label: 'Insights',         icon: '🧠' },
  { id: 'settings',      label: 'Settings',         icon: '⚙️' },
]

export default function Sidebar({ activePage, onNavigate, alertsByPage, alertCount, user }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoWrap}>💎</div>
        <span className={styles.name}>{APP_NAME}</span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activePage === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {alertsByPage?.[item.id] > 0 && (
              <span className={styles.badge}>{alertsByPage[item.id]}</span>
            )}
          </button>
        ))}
      </nav>

      <div className={styles.userInfo}>
        <div className={styles.avatar}>{user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</div>
        <div className={styles.userDetails}>
          <div className={styles.userName}>{user?.displayName || 'User'}</div>
          <div className={styles.userEmail}>{user?.email}</div>
        </div>
      </div>
    </aside>
  )
}

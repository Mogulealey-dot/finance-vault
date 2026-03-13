import { useState } from 'react'
import styles from './SettingsPage.module.css'
import { CURRENCIES, BUDGET_METHODS } from '../config/constants'

export default function SettingsPage({ user, settings, updateSettings, logOut }) {
  const [form, setForm] = useState({
    currency: settings?.currency || 'USD',
    budgetMethod: settings?.budgetMethod || 'zero',
    monthlyIncomeGoal: settings?.monthlyIncomeGoal || '',
    savingsGoalPct: settings?.savingsGoalPct || 20,
    displayName: user?.displayName || '',
    showCents: settings?.showCents ?? true,
    darkMode: true,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>👤 Profile</h2>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Display Name</label>
            <input className={styles.input} type="text" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={user?.email || ''} disabled />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>💰 Financial Preferences</h2>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Currency</label>
            <select className={styles.input} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.label}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Budget Method</label>
            <select className={styles.input} value={form.budgetMethod} onChange={e => setForm(f => ({ ...f, budgetMethod: e.target.value }))}>
              {BUDGET_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <p className={styles.hint}>{BUDGET_METHODS.find(m => m.id === form.budgetMethod)?.description}</p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Monthly Income Goal ($)</label>
            <input className={styles.input} type="number" min="0" value={form.monthlyIncomeGoal} onChange={e => setForm(f => ({ ...f, monthlyIncomeGoal: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Savings Goal (%)</label>
            <input className={styles.input} type="number" min="0" max="100" value={form.savingsGoalPct} onChange={e => setForm(f => ({ ...f, savingsGoalPct: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🔒 Security</h2>
        <div className={styles.securityInfo}>
          <div className={styles.secItem}>
            <span className={styles.secIcon}>🔐</span>
            <div>
              <div className={styles.secLabel}>256-Bit Encryption</div>
              <div className={styles.secSub}>All data encrypted at rest and in transit</div>
            </div>
            <span className={styles.secBadge}>Active</span>
          </div>
          <div className={styles.secItem}>
            <span className={styles.secIcon}>☁️</span>
            <div>
              <div className={styles.secLabel}>Firebase Authentication</div>
              <div className={styles.secSub}>Secured by Google Firebase Auth</div>
            </div>
            <span className={styles.secBadge}>Active</span>
          </div>
          <div className={styles.secItem}>
            <span className={styles.secIcon}>🔑</span>
            <div>
              <div className={styles.secLabel}>Multi-Factor Authentication</div>
              <div className={styles.secSub}>Add a second layer of protection</div>
            </div>
            <span className={styles.secBadgePending}>Coming Soon</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>📊 Display</h2>
        <label className={styles.toggle}>
          <input type="checkbox" checked={form.showCents} onChange={e => setForm(f => ({ ...f, showCents: e.target.checked }))} />
          <span>Show cents in amounts</span>
        </label>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
        <button className={styles.logoutBtn} onClick={logOut}>Sign Out</button>
      </div>
    </div>
  )
}

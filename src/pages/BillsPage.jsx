import { useState } from 'react'
import styles from './BillsPage.module.css'
import { RECURRENCE } from '../config/constants'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0) }

const BILL_CATEGORIES = ['Streaming', 'Software', 'Utilities', 'Insurance', 'Loan', 'Subscription', 'Phone', 'Internet', 'Membership', 'Other']
const EMPTY_FORM = { name: '', amount: '', dueDay: '', recurrence: 'monthly', category: 'Subscription', autopay: false, url: '', notes: '' }

export default function BillsPage({ bills, addBill, updateBill, removeBill }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [tab, setTab] = useState('all')

  const totalMonthly = bills.reduce((s, b) => {
    const m = { weekly: 4.33, 'bi-weekly': 2.17, monthly: 1, quarterly: 0.33, annually: 0.083 }
    return s + (b.amount || 0) * (m[b.recurrence] || 1)
  }, 0)

  const subscriptions = bills.filter(b => ['Streaming', 'Software', 'Subscription', 'Membership'].includes(b.category))
  const regularBills = bills.filter(b => !['Streaming', 'Software', 'Subscription', 'Membership'].includes(b.category))

  const displayed = tab === 'subscriptions' ? subscriptions : tab === 'bills' ? regularBills : bills

  const handleSave = async () => {
    if (!form.name || !form.amount) return
    const data = { ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) || 1 }
    if (editing) { await updateBill(editing, data); setEditing(null) }
    else await addBill(data)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleEdit = (b) => {
    setForm({ name: b.name, amount: b.amount, dueDay: b.dueDay || '', recurrence: b.recurrence || 'monthly', category: b.category || 'Subscription', autopay: b.autopay || false, url: b.url || '', notes: b.notes || '' })
    setEditing(b.id)
    setShowForm(true)
  }

  const today = new Date()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bills & Subscriptions</h1>
          <p className={styles.sub}>Track recurring payments · Spot subscriptions to cancel</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }}>+ Add Bill</button>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.sumCard}>
          <span className={styles.sumLabel}>Monthly Total</span>
          <span className={styles.sumVal} style={{ color: '#ef4444' }}>{fmt(totalMonthly)}</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumLabel}>Annual Total</span>
          <span className={styles.sumVal}>{fmt(totalMonthly * 12)}</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumLabel}>Subscriptions</span>
          <span className={styles.sumVal}>{subscriptions.length}</span>
        </div>
        <div className={styles.sumCard}>
          <span className={styles.sumLabel}>Autopay Active</span>
          <span className={styles.sumVal} style={{ color: '#22c55e' }}>{bills.filter(b => b.autopay).length}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        {[['all', 'All'], ['subscriptions', '🔄 Subscriptions'], ['bills', '📄 Bills']].map(([id, label]) => (
          <button key={id} className={`${styles.tab} ${tab === id ? styles.active : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editing ? 'Edit' : 'Add'} Bill / Subscription</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} type="text" placeholder="Name (e.g. Netflix)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className={styles.input} type="number" min="0" step="0.01" placeholder="Amount ($)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <select className={styles.input} value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
              {RECURRENCE.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <input className={styles.input} type="number" min="1" max="31" placeholder="Due day of month" value={form.dueDay} onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))} />
            <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {BILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={styles.input} type="text" placeholder="Website / URL (optional)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.autopay} onChange={e => setForm(f => ({ ...f, autopay: e.target.checked }))} />
            Autopay enabled
          </label>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      <div className={styles.billList}>
        {displayed.length === 0 ? (
          <div className={styles.empty}>No bills found. Add your recurring payments to track them all in one place.</div>
        ) : displayed.map(b => {
          const dueDate = b.dueDay ? new Date(today.getFullYear(), today.getMonth(), b.dueDay) : null
          const daysUntil = dueDate ? Math.ceil((dueDate - today) / 86400000) : null
          const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 3
          return (
            <div key={b.id} className={`${styles.billRow} ${isUrgent ? styles.urgent : ''}`}>
              <div className={styles.billIcon}>{getCatIcon(b.category)}</div>
              <div className={styles.billInfo}>
                <div className={styles.billName}>{b.name}</div>
                <div className={styles.billMeta}>
                  {b.category} · {b.recurrence}
                  {b.dueDay ? ` · Due day ${b.dueDay}` : ''}
                  {b.autopay && <span className={styles.autopayBadge}>⚡ Autopay</span>}
                </div>
              </div>
              <div className={styles.billRight}>
                <div className={styles.billAmt}>{fmt(b.amount)}<span className={styles.billPer}>/{b.recurrence === 'monthly' ? 'mo' : b.recurrence === 'annually' ? 'yr' : b.recurrence}</span></div>
                {daysUntil !== null && daysUntil >= 0 && (
                  <div className={styles.dueIn} style={{ color: isUrgent ? '#f87171' : '#64748b' }}>
                    {daysUntil === 0 ? 'Due today!' : `Due in ${daysUntil}d`}
                  </div>
                )}
              </div>
              <div className={styles.billActions}>
                <button className={styles.iconBtn} onClick={() => handleEdit(b)}>✏️</button>
                <button className={styles.iconBtn} onClick={() => removeBill(b.id)}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getCatIcon(cat) {
  const m = { Streaming: '📺', Software: '💻', Utilities: '⚡', Insurance: '🛡️', Loan: '📋', Subscription: '🔄', Phone: '📱', Internet: '🌐', Membership: '🏷️', Other: '📌' }
  return m[cat] || '📌'
}

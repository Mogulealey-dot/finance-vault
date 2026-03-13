import { useState } from 'react'
import styles from './AccountsPage.module.css'
import { ACCOUNT_TYPES } from '../config/constants'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0) }

const EMPTY_FORM = { name: '', type: 'checking', balance: '', institution: '', accountNumber: '', notes: '' }

export default function AccountsPage({ accounts, addAccount, updateAccount, removeAccount }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)

  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
  const totalDebt = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)
  const netWorth = totalAssets - totalDebt

  const handleSave = async () => {
    if (!form.name || form.balance === '') return
    const data = { ...form, balance: parseFloat(form.balance) }
    if (editing) { await updateAccount(editing, data); setEditing(null) }
    else await addAccount(data)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleEdit = (a) => {
    setForm({ name: a.name, type: a.type, balance: a.balance, institution: a.institution || '', accountNumber: a.accountNumber || '', notes: a.notes || '' })
    setEditing(a.id)
    setShowForm(true)
  }

  const grouped = ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t.id] = accounts.filter(a => a.type === t.id)
    return acc
  }, {})

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Accounts</h1>
        <button className={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }}>+ Link Account</button>
      </div>

      <div className={styles.netRow}>
        <div className={styles.netCard} style={{ borderTopColor: '#22c55e' }}>
          <span className={styles.netLabel}>Total Assets</span>
          <span className={styles.netVal} style={{ color: '#22c55e' }}>{fmt(totalAssets)}</span>
        </div>
        <div className={styles.netCard} style={{ borderTopColor: '#ef4444' }}>
          <span className={styles.netLabel}>Total Debt</span>
          <span className={styles.netVal} style={{ color: '#ef4444' }}>{fmt(totalDebt)}</span>
        </div>
        <div className={styles.netCard} style={{ borderTopColor: netWorth >= 0 ? '#6366f1' : '#ef4444' }}>
          <span className={styles.netLabel}>Net Worth</span>
          <span className={styles.netVal} style={{ color: netWorth >= 0 ? '#6366f1' : '#ef4444' }}>{fmt(netWorth)}</span>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editing ? 'Edit' : 'Add'} Account</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} type="text" placeholder="Account Name (e.g. Chase Checking)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className={styles.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <input className={styles.input} type="number" step="0.01" placeholder="Current Balance (negative for debt)" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            <input className={styles.input} type="text" placeholder="Institution (e.g. Chase)" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
            <input className={styles.input} type="text" placeholder="Last 4 digits (optional)" value={form.accountNumber} maxLength={4} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>Save Account</button>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className={styles.empty}>
          <p>No accounts yet. Add your checking, savings, credit cards, and investments to track your full financial picture.</p>
        </div>
      ) : (
        ACCOUNT_TYPES.map(t => {
          const accs = grouped[t.id]
          if (!accs?.length) return null
          return (
            <div key={t.id} className={styles.group}>
              <h2 className={styles.groupTitle}>{t.icon} {t.label}</h2>
              <div className={styles.accountGrid}>
                {accs.map(a => (
                  <div key={a.id} className={styles.accountCard}>
                    <div className={styles.accountHeader}>
                      <div>
                        <div className={styles.accountName}>{a.name}</div>
                        {a.institution && <div className={styles.accountInst}>{a.institution}{a.accountNumber ? ` ···${a.accountNumber}` : ''}</div>}
                      </div>
                      <div className={styles.accountActions}>
                        <button className={styles.iconBtn} onClick={() => handleEdit(a)}>✏️</button>
                        <button className={styles.iconBtn} onClick={() => removeAccount(a.id)}>🗑️</button>
                      </div>
                    </div>
                    <div className={styles.accountBal} style={{ color: a.balance < 0 ? '#ef4444' : '#22c55e' }}>{fmt(a.balance)}</div>
                    <div className={styles.accountType}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

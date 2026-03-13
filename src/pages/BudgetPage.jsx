import { useState } from 'react'
import styles from './BudgetPage.module.css'
import { TRANSACTION_CATEGORIES } from '../config/categories'
import { BUDGET_METHODS } from '../config/constants'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0) }

const EMPTY_FORM = { category: 'food', label: '', limit: '', method: 'custom', notes: '' }

export default function BudgetPage({ budgets, addBudget, updateBudget, removeBudget, stats }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)

  const totalBudgeted = budgets.reduce((s, b) => s + (b.limit || 0), 0)
  const totalSpent = stats?.budgetUtil?.reduce((s, b) => s + (b.spent || 0), 0) || 0

  const handleSave = async () => {
    if (!form.limit) return
    const cat = TRANSACTION_CATEGORIES.find(c => c.id === form.category)
    const data = { ...form, limit: parseFloat(form.limit), label: form.label || cat?.label }
    if (editing) { await updateBudget(editing, data); setEditing(null) }
    else await addBudget(data)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleEdit = (b) => {
    setForm({ category: b.category, label: b.label || '', limit: b.limit, method: b.method || 'custom', notes: b.notes || '' })
    setEditing(b.id)
    setShowForm(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Budget Planner</h1>
          <p className={styles.sub}>Assign every dollar a purpose · Zero-based budgeting</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }}>+ Add Budget</button>
      </div>

      <div className={styles.overviewCards}>
        <div className={styles.overCard}>
          <span className={styles.overLabel}>Total Budgeted</span>
          <span className={styles.overVal}>{fmt(totalBudgeted)}</span>
        </div>
        <div className={styles.overCard}>
          <span className={styles.overLabel}>Total Spent</span>
          <span className={styles.overVal} style={{ color: totalSpent > totalBudgeted ? '#ef4444' : '#e2e8f0' }}>{fmt(totalSpent)}</span>
        </div>
        <div className={styles.overCard}>
          <span className={styles.overLabel}>Remaining</span>
          <span className={styles.overVal} style={{ color: totalBudgeted - totalSpent >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(totalBudgeted - totalSpent)}</span>
        </div>
        <div className={styles.overCard}>
          <span className={styles.overLabel}>Monthly Income</span>
          <span className={styles.overVal} style={{ color: '#6366f1' }}>{fmt(stats?.income)}</span>
        </div>
      </div>

      {/* Zero-based summary */}
      {stats?.income > 0 && (
        <div className={styles.zeroCard}>
          <h3 className={styles.zeroTitle}>🎯 Zero-Based Balance</h3>
          <p className={styles.zeroSub}>Income minus all budget allocations should equal $0</p>
          <div className={styles.zeroBar}>
            <div
              className={styles.zeroFill}
              style={{ width: `${Math.min((totalBudgeted / stats.income) * 100, 100)}%`, background: totalBudgeted > stats.income ? '#ef4444' : '#6366f1' }}
            />
          </div>
          <div className={styles.zeroLabels}>
            <span>{fmt(totalBudgeted)} allocated</span>
            <span style={{ color: stats.income - totalBudgeted >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(Math.abs(stats.income - totalBudgeted))} {stats.income - totalBudgeted >= 0 ? 'unassigned' : 'over-allocated'}</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editing ? 'Edit' : 'Create'} Budget Category</h3>
          <div className={styles.formGrid}>
            <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {TRANSACTION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input className={styles.input} type="text" placeholder="Custom label (optional)" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <input className={styles.input} type="number" min="0" step="1" placeholder="Monthly limit ($)" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} />
            <select className={styles.input} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {BUDGET_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>Save Budget</button>
          </div>
        </div>
      )}

      <div className={styles.budgetList}>
        {budgets.length === 0 ? (
          <div className={styles.empty}>No budget categories yet. Add one to start planning!</div>
        ) : (stats?.budgetUtil || budgets).map(b => {
          const cat = TRANSACTION_CATEGORIES.find(c => c.id === b.category) || {}
          const spent = b.spent || 0
          const limit = b.limit || 0
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
          const over = spent > limit
          const barColor = over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e'
          return (
            <div key={b.id} className={styles.budgetRow}>
              <div className={styles.budgetIcon} style={{ background: (cat.color || '#6366f1') + '22', color: cat.color || '#6366f1' }}>{cat.icon || '📌'}</div>
              <div className={styles.budgetInfo}>
                <div className={styles.budgetHeader}>
                  <span className={styles.budgetLabel}>{b.label || cat.label}</span>
                  <span className={styles.budgetAmts}>
                    <span style={{ color: over ? '#ef4444' : '#e2e8f0' }}>{fmt(spent)}</span>
                    <span className={styles.divider}>/</span>
                    <span className={styles.budgetLimit}>{fmt(limit)}</span>
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div className={styles.budgetFooter}>
                  <span className={styles.pctLabel} style={{ color: barColor }}>{Math.round(pct)}% used</span>
                  <span className={styles.remaining} style={{ color: over ? '#ef4444' : '#64748b' }}>
                    {over ? `${fmt(spent - limit)} over` : `${fmt(limit - spent)} left`}
                  </span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <button className={styles.iconBtn} onClick={() => handleEdit(b)}>✏️</button>
                <button className={styles.iconBtn} onClick={() => removeBudget(b.id)}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

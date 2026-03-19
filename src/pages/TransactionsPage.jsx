import { useState } from 'react'
import styles from './TransactionsPage.module.css'
import { TRANSACTION_CATEGORIES, getCategoryById } from '../config/categories'
import { format } from 'date-fns'
import { exportTransactionsPdf } from '../utils/exportPdf'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0) }

const EMPTY_FORM = { type: 'expense', amount: '', description: '', category: 'food', date: format(new Date(), 'yyyy-MM-dd'), account: '', notes: '' }

export default function TransactionsPage({ uid, transactions, accounts, addTx, updateTx, removeTx }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState({ type: 'all', category: 'all', search: '' })

  const filtered = transactions.filter(tx => {
    if (filter.type !== 'all' && tx.type !== filter.type) return false
    if (filter.category !== 'all' && tx.category !== filter.category) return false
    if (filter.search && !`${tx.description}${tx.merchant}`.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const handleSave = async () => {
    if (!form.amount || !form.description) return
    const data = { ...form, amount: parseFloat(form.amount) }
    if (editing) { await updateTx(editing, data); setEditing(null) }
    else await addTx(data)
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleEdit = (tx) => {
    setForm({ type: tx.type, amount: tx.amount, description: tx.description, category: tx.category, date: tx.date || format(new Date(), 'yyyy-MM-dd'), account: tx.account || '', notes: tx.notes || '' })
    setEditing(tx.id)
    setShowForm(true)
  }

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transactions</h1>
        <div className={styles.headerActions}>
          <button className={styles.downloadBtn} onClick={() => exportTransactionsPdf(filtered, accounts)} title="Export visible transactions to PDF">⬇ Export PDF</button>
          <button className={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }}>+ Add Transaction</button>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard} style={{ borderTopColor: '#22c55e' }}>
          <span className={styles.summaryLabel}>Income</span>
          <span className={styles.summaryVal} style={{ color: '#22c55e' }}>{fmt(totalIncome)}</span>
        </div>
        <div className={styles.summaryCard} style={{ borderTopColor: '#ef4444' }}>
          <span className={styles.summaryLabel}>Expenses</span>
          <span className={styles.summaryVal} style={{ color: '#ef4444' }}>{fmt(totalExpenses)}</span>
        </div>
        <div className={styles.summaryCard} style={{ borderTopColor: totalIncome - totalExpenses >= 0 ? '#22c55e' : '#ef4444' }}>
          <span className={styles.summaryLabel}>Net</span>
          <span className={styles.summaryVal} style={{ color: totalIncome - totalExpenses >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(totalIncome - totalExpenses)}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <input className={styles.search} placeholder="Search transactions..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        <select className={styles.select} value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className={styles.select} value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="all">All Categories</option>
          {TRANSACTION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editing ? 'Edit' : 'Add'} Transaction</h3>
          <div className={styles.formGrid}>
            <select className={styles.input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="expense">💸 Expense</option>
              <option value="income">💰 Income</option>
            </select>
            <input className={styles.input} type="number" min="0" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <input className={styles.input} type="text" placeholder="Description / Merchant" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <select className={styles.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {TRANSACTION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input className={styles.input} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <select className={styles.input} value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}>
              <option value="">— Account —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <input className={`${styles.input} ${styles.fullWidth}`} type="text" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      <div className={styles.txList}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No transactions found. Add your first one!</div>
        ) : filtered.map(tx => {
          const cat = getCategoryById(tx.category)
          return (
            <div key={tx.id} className={styles.txRow}>
              <div className={styles.txIcon} style={{ background: cat.color + '22', color: cat.color }}>{cat.icon}</div>
              <div className={styles.txMain}>
                <span className={styles.txDesc}>{tx.description || 'Transaction'}</span>
                <span className={styles.txMeta}>{cat.label} · {tx.date || '—'}</span>
              </div>
              <div className={styles.txRight}>
                <span className={styles.txAmt} style={{ color: tx.type === 'income' ? '#22c55e' : '#f87171' }}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <div className={styles.txActions}>
                  <button className={styles.iconBtn} onClick={() => handleEdit(tx)} title="Edit">✏️</button>
                  <button className={styles.iconBtn} onClick={() => removeTx(tx.id)} title="Delete">🗑️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

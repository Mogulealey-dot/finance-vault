import { useState } from 'react'
import styles from './InvestmentsPage.module.css'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0) }
function fmtPct(n) { return `${n >= 0 ? '+' : ''}${n?.toFixed(2)}%` }

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981']
const ASSET_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Bond', 'Crypto', 'Real Estate', 'Commodity', 'Other']
const EMPTY_FORM = { ticker: '', name: '', assetType: 'Stock', shares: '', purchasePrice: '', currentPrice: '', account: '' }

export default function InvestmentsPage({ investments, addInvestment, updateInvestment, removeInvestment, accounts, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)

  const totalCost = investments.reduce((s, i) => s + ((i.shares || 0) * (i.purchasePrice || 0)), 0)
  const totalValue = investments.reduce((s, i) => s + ((i.shares || 0) * (i.currentPrice || i.purchasePrice || 0)), 0)
  const totalGain = totalValue - totalCost
  const gainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const pieData = investments.map((inv, i) => ({
    name: inv.ticker || inv.name,
    value: (inv.shares || 0) * (inv.currentPrice || inv.purchasePrice || 0),
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0)

  const handleSave = async () => {
    if (!form.name || !form.shares) return
    const data = { ...form, shares: parseFloat(form.shares), purchasePrice: parseFloat(form.purchasePrice || 0), currentPrice: parseFloat(form.currentPrice || form.purchasePrice || 0) }
    if (editing) {
      await updateInvestment(editing, data)
      setEditing(null)
      showToast?.('Investment updated')
    } else {
      await addInvestment(data)
      showToast?.('Investment added')
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleEdit = (inv) => {
    setForm({ ticker: inv.ticker || '', name: inv.name || '', assetType: inv.assetType || 'Stock', shares: inv.shares, purchasePrice: inv.purchasePrice, currentPrice: inv.currentPrice || inv.purchasePrice, account: inv.account || '' })
    setEditing(inv.id)
    setShowForm(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Investments</h1>
          <p className={styles.sub}>Portfolio tracking · Retirement planning · Net worth</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true) }}>+ Add Holding</button>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.sumCard} style={{ borderTopColor: '#6366f1' }}>
          <span className={styles.sumLabel}>Portfolio Value</span>
          <span className={styles.sumVal}>{fmt(totalValue)}</span>
        </div>
        <div className={styles.sumCard} style={{ borderTopColor: '#94a3b8' }}>
          <span className={styles.sumLabel}>Cost Basis</span>
          <span className={styles.sumVal}>{fmt(totalCost)}</span>
        </div>
        <div className={styles.sumCard} style={{ borderTopColor: totalGain >= 0 ? '#22c55e' : '#ef4444' }}>
          <span className={styles.sumLabel}>Total Gain/Loss</span>
          <span className={styles.sumVal} style={{ color: totalGain >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(totalGain)}</span>
        </div>
        <div className={styles.sumCard} style={{ borderTopColor: gainPct >= 0 ? '#22c55e' : '#ef4444' }}>
          <span className={styles.sumLabel}>Return</span>
          <span className={styles.sumVal} style={{ color: gainPct >= 0 ? '#22c55e' : '#ef4444' }}>{fmtPct(gainPct)}</span>
        </div>
      </div>

      {investments.length > 0 && (
        <div className={styles.chartCard}>
          <h2 className={styles.cardTitle}>Portfolio Allocation</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editing ? 'Edit' : 'Add'} Holding</h3>
          <div className={styles.formGrid}>
            <input className={styles.input} type="text" placeholder="Ticker (e.g. AAPL)" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
            <input className={styles.input} type="text" placeholder="Name (e.g. Apple Inc.)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className={styles.input} value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))}>
              {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input className={styles.input} type="number" min="0" step="any" placeholder="Shares / Units" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} />
            <input className={styles.input} type="number" min="0" step="any" placeholder="Purchase Price ($)" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
            <input className={styles.input} type="number" min="0" step="any" placeholder="Current Price ($)" value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} />
            <select className={styles.input} value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}>
              <option value="">— Account —</option>
              {accounts.filter(a => ['investment', 'retirement', 'crypto'].includes(a.type)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave}>Save Holding</button>
          </div>
        </div>
      )}

      <div className={styles.holdingsList}>
        {investments.length === 0 ? (
          <div className={styles.empty}>No holdings yet. Add stocks, ETFs, crypto, or retirement accounts to track your portfolio.</div>
        ) : investments.map((inv, idx) => {
          const cost = (inv.shares || 0) * (inv.purchasePrice || 0)
          const value = (inv.shares || 0) * (inv.currentPrice || inv.purchasePrice || 0)
          const gain = value - cost
          const pct = cost > 0 ? (gain / cost) * 100 : 0
          const color = COLORS[idx % COLORS.length]
          return (
            <div key={inv.id} className={styles.holdingRow}>
              <div className={styles.holdingDot} style={{ background: color }} />
              <div className={styles.holdingInfo}>
                <div className={styles.holdingHeader}>
                  <span className={styles.ticker}>{inv.ticker || '—'}</span>
                  <span className={styles.holdingName}>{inv.name}</span>
                  <span className={styles.assetType}>{inv.assetType}</span>
                </div>
                <div className={styles.holdingDetails}>
                  <span>{inv.shares} shares @ {fmt(inv.purchasePrice)}</span>
                  <span>Current: {fmt(inv.currentPrice)}</span>
                </div>
              </div>
              <div className={styles.holdingRight}>
                <div className={styles.holdingValue}>{fmt(value)}</div>
                <div className={styles.holdingGain} style={{ color: gain >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(gain)} ({fmtPct(pct)})</div>
              </div>
              <div className={styles.holdingActions}>
                <button className={styles.iconBtn} onClick={() => handleEdit(inv)}>✏️</button>
                <button className={styles.iconBtn} onClick={() => { removeInvestment(inv.id); showToast?.('Investment removed', 'error') }}>🗑️</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

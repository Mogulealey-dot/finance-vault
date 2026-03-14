import { useMemo } from 'react'
import { format } from 'date-fns'
import styles from './DashboardPage.module.css'
import { getCategoryById } from '../config/categories'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className={styles.statCard} style={{ borderTopColor: color }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  )
}

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0) }

// Animated skeleton pulse block
function Skeleton({ width = '100%', height = 20, radius = 6, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg,#1e293b 25%,#263247 50%,#1e293b 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonPulse 1.4s ease-in-out infinite',
      ...style,
    }} />
  )
}

if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const s = document.createElement('style')
  s.id = 'skeleton-style'
  s.textContent = '@keyframes skeletonPulse{0%,100%{background-position:200% 0}50%{background-position:0 0}}'
  document.head.appendChild(s)
}

function SkeletonDashboard() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <Skeleton width={220} height={28} radius={6} style={{ marginBottom: 10 }} />
        <Skeleton width={160} height={16} radius={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ background: '#1e293b', borderRadius: 12, padding: 20, borderTop: '3px solid #334155' }}>
            <Skeleton width={32} height={32} radius={8} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={24} radius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={14} radius={4} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <Skeleton width={180} height={18} radius={4} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={160} radius={8} />
        </div>
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 20 }}>
          <Skeleton width={200} height={18} radius={4} style={{ marginBottom: 16 }} />
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Skeleton width={24} height={24} radius={6} />
              <Skeleton width="40%" height={14} radius={4} />
              <Skeleton width="30%" height={10} radius={4} style={{ flex: 1 }} />
              <Skeleton width={60} height={14} radius={4} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage({ user, stats, alerts, accounts, thisMonthTx, loading, onNavigate }) {
  if (loading) return <SkeletonDashboard />
  const name = user?.displayName?.split(' ')[0] || 'there'

  // Build spending trend from last 7 days of transactions
  const trendData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const label = format(d, 'EEE')
      const spent = (thisMonthTx || []).filter(t => {
        if (t.type !== 'expense') return false
        try {
          const td = t.date ? new Date(t.date) : t.createdAt?.toDate?.()
          return td && format(td, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
        } catch { return false }
      }).reduce((s, t) => s + (t.amount || 0), 0)
      days.push({ day: label, amount: spent })
    }
    return days
  }, [thisMonthTx])

  const topCategories = useMemo(
    () => Object.entries(stats?.byCategory || {}).sort((a, b) => b[1] - a[1]).slice(0, 5),
    [stats?.byCategory]
  )

  const insights = useMemo(() => generateInsights(stats), [stats])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Good {getTimeOfDay()}, {name} 👋</h1>
          <p className={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {alerts?.length > 0 && (
          <div className={styles.alertBanner}>
            ⚠️ {alerts.length} alert{alerts.length > 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Net Worth" value={fmt(stats?.netWorth)} icon="💎" color="#6366f1" sub={`Assets ${fmt(stats?.totalAssets)} · Debts ${fmt(stats?.totalLiabilities)}`} />
        <StatCard label="Monthly Income" value={fmt(stats?.income)} icon="💰" color="#22c55e" />
        <StatCard label="Monthly Spending" value={fmt(stats?.expenses)} icon="💸" color="#ef4444" />
        <StatCard label="Net Savings" value={fmt(stats?.netSavings)} icon="📊" color={stats?.netSavings >= 0 ? '#22c55e' : '#ef4444'} sub={stats?.income > 0 ? `${Math.round((stats.netSavings / stats.income) * 100)}% savings rate` : ''} />
        <StatCard label="Portfolio Value" value={fmt(stats?.portfolioValue)} icon="📈" color="#f59e0b" />
        <StatCard label="Upcoming Bills" value={stats?.upcomingBills?.length || 0} icon="🔔" color="#06b6d4" sub="due this week" />
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>7-Day Spending Trend</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#spend)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top Spending Categories</h2>
          {topCategories.length === 0 ? (
            <p className={styles.empty}>No spending recorded this month</p>
          ) : (
            <div className={styles.categoryList}>
              {topCategories.map(([cat, amt]) => {
                const c = getCategoryById(cat)
                const pct = stats?.income > 0 ? (amt / stats.income) * 100 : 0
                return (
                  <div key={cat} className={styles.catRow}>
                    <span>{c.icon}</span>
                    <span className={styles.catLabel}>{c.label}</span>
                    <div className={styles.catBar}>
                      <div className={styles.catFill} style={{ width: `${Math.min(pct, 100)}%`, background: c.color }} />
                    </div>
                    <span className={styles.catAmt}>{fmt(amt)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Accounts Overview</h2>
          {(!accounts || accounts.length === 0) ? (
            <div className={styles.empty}>
              <p>No accounts linked yet.</p>
              <button className={styles.linkBtn} onClick={() => onNavigate('accounts')}>+ Add Account</button>
            </div>
          ) : (
            <div className={styles.accountList}>
              {accounts.slice(0, 5).map(a => (
                <div key={a.id} className={styles.accountRow}>
                  <span className={styles.accountIcon}>{getAccountIcon(a.type)}</span>
                  <div className={styles.accountInfo}>
                    <span className={styles.accountName}>{a.name}</span>
                    <span className={styles.accountType}>{a.type}</span>
                  </div>
                  <span className={styles.accountBal} style={{ color: a.balance < 0 ? '#ef4444' : '#22c55e' }}>{fmt(a.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Recent Transactions</h2>
            <button className={styles.viewAll} onClick={() => onNavigate('transactions')}>View all →</button>
          </div>
          {(!thisMonthTx || thisMonthTx.length === 0) ? (
            <p className={styles.empty}>No transactions this month</p>
          ) : (
            <div className={styles.txList}>
              {thisMonthTx.slice(0, 6).map(tx => {
                const cat = getCategoryById(tx.category)
                return (
                  <div key={tx.id} className={styles.txRow}>
                    <span className={styles.txIcon}>{cat.icon}</span>
                    <div className={styles.txInfo}>
                      <span className={styles.txName}>{tx.description || tx.merchant || 'Transaction'}</span>
                      <span className={styles.txCat}>{cat.label}</span>
                    </div>
                    <span className={styles.txAmt} style={{ color: tx.type === 'income' ? '#22c55e' : '#f87171' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className={`${styles.card} ${styles.aiPanel}`}>
        <h2 className={styles.cardTitle}>🧠 AI Insights</h2>
        <div className={styles.insightGrid}>
          {insights.map((insight, i) => (
            <div key={i} className={`${styles.insight} ${styles[insight.type]}`}>
              <span className={styles.insightIcon}>{insight.icon}</span>
              <p>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getAccountIcon(type) {
  const icons = { checking: '🏦', savings: '💰', credit: '💳', investment: '📈', retirement: '🏖️', loan: '📋', crypto: '🪙', cash: '💵' }
  return icons[type] || '🏦'
}

function generateInsights(stats) {
  const insights = []
  if (!stats) return [{ icon: '💡', text: 'Add transactions and accounts to see personalized insights.', type: 'info' }]

  const savingsRate = stats.income > 0 ? (stats.netSavings / stats.income) * 100 : 0
  if (savingsRate >= 20) insights.push({ icon: '🎉', text: `Great savings rate of ${Math.round(savingsRate)}%! You're on track for long-term wealth building.`, type: 'positive' })
  else if (savingsRate > 0) insights.push({ icon: '📊', text: `Your savings rate is ${Math.round(savingsRate)}%. Aim for 20%+ to accelerate financial independence.`, type: 'info' })
  else if (stats.income > 0) insights.push({ icon: '⚠️', text: `You're spending more than you earn this month. Review your budget to find cuts.`, type: 'warning' })

  if (stats.budgetUtil) {
    const over = stats.budgetUtil.filter(b => b.pct >= 1)
    if (over.length > 0) insights.push({ icon: '🚨', text: `Over budget in ${over.length} categor${over.length > 1 ? 'ies' : 'y'}: ${over.map(b => b.label || b.category).join(', ')}.`, type: 'warning' })
  }

  if (stats.netWorth > 0) insights.push({ icon: '💎', text: `Your net worth is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.netWorth)}. Track it monthly to see growth.`, type: 'positive' })

  if (insights.length === 0) insights.push({ icon: '💡', text: 'Add more transactions and set budgets to get personalized AI insights.', type: 'info' })
  return insights.slice(0, 4)
}

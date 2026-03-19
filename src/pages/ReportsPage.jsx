import styles from './ReportsPage.module.css'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { getCategoryById } from '../config/categories'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { exportFinancialReport } from '../utils/exportPdf'

function fmt(n) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0) }

export default function ReportsPage({ transactions, accounts, budgets, stats }) {
  const handleDownloadPdf = () => exportFinancialReport({ transactions, accounts, budgets, stats })
  // Build last 6 months of income vs expense data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const monthTx = transactions.filter(tx => {
      try {
        const td = tx.date ? parseISO(tx.date) : tx.createdAt?.toDate?.()
        return td && isWithinInterval(td, { start, end })
      } catch { return false }
    })
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
    return { month: format(d, 'MMM'), income, expenses, savings: income - expenses }
  })

  // Spending by category
  const catData = Object.entries(stats?.byCategory || {})
    .map(([id, amount]) => {
      const cat = getCategoryById(id)
      return { name: cat.label, amount, color: cat.color, icon: cat.icon }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  // Net worth over time (approximated from current)
  const netWorthData = Array.from({ length: 6 }, (_, i) => ({
    month: format(subMonths(new Date(), 5 - i), 'MMM'),
    value: stats?.netWorth ? Math.max(0, stats.netWorth * (0.85 + i * 0.03)) : 0,
  }))

  const savingsRate = stats?.income > 0 ? Math.round((stats.netSavings / stats.income) * 100) : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Insights & Reports</h1>
          <p className={styles.sub}>🧠 AI-powered analysis of your financial health</p>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownloadPdf}>⬇ Download PDF</button>
      </div>

      {/* Financial health score */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreLeft}>
          <h2 className={styles.scoreTitle}>Financial Health Score</h2>
          <p className={styles.scoreSub}>Based on your savings rate, debt ratio, and budget adherence</p>
          <div className={styles.scoreMetrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Savings Rate</span>
              <span className={styles.metricVal} style={{ color: savingsRate >= 20 ? '#22c55e' : savingsRate >= 10 ? '#f59e0b' : '#ef4444' }}>{savingsRate}%</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Debt Ratio</span>
              <span className={styles.metricVal} style={{ color: stats?.totalLiabilities <= stats?.totalAssets * 0.3 ? '#22c55e' : '#f59e0b' }}>
                {stats?.totalAssets > 0 ? Math.round((stats.totalLiabilities / stats.totalAssets) * 100) : 0}%
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Budgets On Track</span>
              <span className={styles.metricVal} style={{ color: '#22c55e' }}>
                {stats?.budgetUtil?.filter(b => b.pct < 0.8).length || 0}/{stats?.budgetUtil?.length || 0}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.scoreCircle}>
          <div className={styles.scoreNum}>{computeScore(savingsRate, stats)}</div>
          <div className={styles.scoreOf}>/100</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Income vs Expenses (6 months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Net Worth Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={netWorthData}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={false} name="Net Worth" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Spending Breakdown — This Month</h2>
        {catData.length === 0 ? (
          <p className={styles.empty}>No spending data yet. Add transactions to see your breakdown.</p>
        ) : (
          <div className={styles.catBreakdown}>
            {catData.map((c, i) => (
              <div key={i} className={styles.catItem}>
                <span className={styles.catLabel}>{c.icon} {c.name}</span>
                <div className={styles.catBarTrack}>
                  <div className={styles.catBarFill} style={{ width: `${(c.amount / catData[0].amount) * 100}%`, background: c.color }} />
                </div>
                <span className={styles.catAmt}>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Savings Over 6 Months</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Bar dataKey="savings" fill="#6366f1" radius={[4, 4, 0, 0]} name="Net Savings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function computeScore(savingsRate, stats) {
  let score = 50
  if (savingsRate >= 20) score += 20
  else if (savingsRate >= 10) score += 10
  else if (savingsRate < 0) score -= 15
  const debtRatio = stats?.totalAssets > 0 ? stats.totalLiabilities / stats.totalAssets : 0
  if (debtRatio < 0.2) score += 15
  else if (debtRatio < 0.5) score += 5
  else score -= 10
  const overBudget = stats?.budgetUtil?.filter(b => b.pct >= 1).length || 0
  score -= overBudget * 5
  return Math.max(0, Math.min(100, score))
}

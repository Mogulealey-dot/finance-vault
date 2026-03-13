import { useMemo } from 'react'
import { ALERT_THRESHOLDS } from '../config/constants'

export function useAlerts({ stats, accounts, bills }) {
  const alerts = useMemo(() => {
    const list = []

    // Budget over/near limit
    if (stats?.budgetUtil) {
      stats.budgetUtil.forEach(b => {
        if (b.pct >= 1) list.push({ id: `budget-over-${b.id}`, type: 'error', page: 'budget', message: `Over budget on ${b.label || b.category}` })
        else if (b.pct >= ALERT_THRESHOLDS.budgetWarning) list.push({ id: `budget-warn-${b.id}`, type: 'warning', page: 'budget', message: `${Math.round(b.pct * 100)}% of ${b.label || b.category} budget used` })
      })
    }

    // Upcoming bills
    if (stats?.upcomingBills) {
      stats.upcomingBills.forEach(b => list.push({ id: `bill-${b.id}`, type: 'warning', page: 'bills', message: `${b.name} due in ${b.dueDay} — $${b.amount}` }))
    }

    // Low balance
    if (accounts) {
      accounts.filter(a => a.type === 'checking' && a.balance < ALERT_THRESHOLDS.lowBalance && a.balance >= 0)
        .forEach(a => list.push({ id: `low-${a.id}`, type: 'error', page: 'accounts', message: `Low balance: ${a.name} ($${a.balance?.toFixed(2)})` }))
    }

    return list
  }, [stats, accounts, bills])

  const alertsByPage = useMemo(() => {
    const map = {}
    alerts.forEach(a => { map[a.page] = (map[a.page] || 0) + 1 })
    return map
  }, [alerts])

  return { alerts, alertsByPage }
}

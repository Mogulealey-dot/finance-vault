import { useMemo } from 'react'
import { useFirestore } from './useFirestore'
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

export function useFinance(uid) {
  const { data: transactions, loading: txLoading, add: addTx, update: updateTx, remove: removeTx } = useFirestore(uid, 'transactions')
  const { data: accounts, loading: acLoading, add: addAccount, update: updateAccount, remove: removeAccount } = useFirestore(uid, 'accounts')
  const { data: budgets, loading: bgLoading, add: addBudget, update: updateBudget, remove: removeBudget } = useFirestore(uid, 'budgets')
  const { data: bills, loading: blLoading, add: addBill, update: updateBill, remove: removeBill } = useFirestore(uid, 'bills')
  const { data: investments, loading: invLoading, add: addInvestment, update: updateInvestment, remove: removeInvestment } = useFirestore(uid, 'investments')

  // Memoized so monthStart/monthEnd are stable object references across renders,
  // preventing thisMonthTx from re-running on every render
  const { monthStart, monthEnd } = useMemo(() => {
    const now = new Date()
    return { monthStart: startOfMonth(now), monthEnd: endOfMonth(now) }
  }, []) // stable for the lifetime of the component; refreshes on remount (month change)

  const thisMonthTx = useMemo(() => transactions.filter(tx => {
    try {
      const d = tx.date ? parseISO(tx.date) : (tx.createdAt?.toDate?.() ?? null)
      return d && isWithinInterval(d, { start: monthStart, end: monthEnd })
    } catch { return false }
  }), [transactions, monthStart, monthEnd])

  const stats = useMemo(() => {
    const income = thisMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const expenses = thisMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)
    const netWorth = accounts.reduce((s, a) => s + (a.balance || 0), 0)
    const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0)
    const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0)

    // Spending by category this month
    const byCategory = {}
    thisMonthTx.filter(t => t.type === 'expense').forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + (t.amount || 0)
    })

    // Budget utilization
    const budgetUtil = budgets.map(b => ({
      ...b,
      spent: byCategory[b.category] || 0,
      pct: b.limit > 0 ? ((byCategory[b.category] || 0) / b.limit) : 0,
    }))

    // Upcoming bills (due within 7 days)
    const today = new Date()
    const upcomingBills = bills.filter(b => {
      if (!b.dueDay) return false
      const dueDate = new Date(today.getFullYear(), today.getMonth(), b.dueDay)
      const diff = (dueDate - today) / 86400000
      return diff >= 0 && diff <= 7
    })

    // Total investment value
    const portfolioValue = investments.reduce((s, i) => s + ((i.shares || 0) * (i.currentPrice || i.purchasePrice || 0)), 0)

    return { income, expenses, netSavings: income - expenses, netWorth, totalAssets, totalLiabilities, byCategory, budgetUtil, upcomingBills, portfolioValue }
  }, [thisMonthTx, accounts, budgets, bills, investments])

  return {
    transactions, txLoading, addTx, updateTx, removeTx,
    accounts, acLoading, addAccount, updateAccount, removeAccount,
    budgets, bgLoading, addBudget, updateBudget, removeBudget,
    bills, blLoading, addBill, updateBill, removeBill,
    investments, invLoading, addInvestment, updateInvestment, removeInvestment,
    thisMonthTx, stats,
  }
}

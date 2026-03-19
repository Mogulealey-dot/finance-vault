import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { getCategoryById } from '../config/categories'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

// ─── Shared helpers ────────────────────────────────────────────────────────────

function addHeader(doc, title, subtitle) {
  // Dark header bar
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FinanceVault', 14, 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text(title, 14, 19)

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.text(subtitle, 14, 25)

  // Generated date — top right
  doc.setTextColor(148, 163, 184)
  doc.text(`Generated ${format(new Date(), 'MMM d, yyyy')}`, 196, 11, { align: 'right' })
}

function addSectionTitle(doc, text, y) {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text(text, 14, y)
  doc.setDrawColor(99, 102, 241)
  doc.setLineWidth(0.5)
  doc.line(14, y + 2, 196, y + 2)
  return y + 8
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`FinanceVault · Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
  }
}

// ─── Financial Report ──────────────────────────────────────────────────────────

export function exportFinancialReport({ transactions, accounts, budgets, stats }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const now = new Date()

  addHeader(doc, 'Financial Report', `${format(subMonths(now, 5), 'MMM yyyy')} – ${format(now, 'MMM yyyy')}`)

  let y = 36

  // ── Summary stats ──────────────────────────────────────────────────────────
  y = addSectionTitle(doc, 'Financial Summary', y)

  const savingsRate = stats?.income > 0 ? Math.round((stats.netSavings / stats.income) * 100) : 0
  const debtRatio = stats?.totalAssets > 0 ? Math.round((stats.totalLiabilities / stats.totalAssets) * 100) : 0

  const summaryData = [
    ['Net Worth', fmt(stats?.netWorth), 'Monthly Income', fmt(stats?.income)],
    ['Total Assets', fmt(stats?.totalAssets), 'Monthly Expenses', fmt(stats?.expenses)],
    ['Total Liabilities', fmt(stats?.totalLiabilities), 'Net Savings', fmt(stats?.netSavings)],
    ['Savings Rate', `${savingsRate}%`, 'Debt Ratio', `${debtRatio}%`],
  ]

  autoTable(doc, {
    startY: y,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 45 },
      1: { textColor: [15, 23, 42], cellWidth: 50 },
      2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 45 },
      3: { textColor: [15, 23, 42], cellWidth: 50 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── 6-month income vs expenses ─────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  y = addSectionTitle(doc, '6-Month Income vs Expenses', y)

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
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
    return [format(d, 'MMMM yyyy'), fmt(income), fmt(expenses), fmt(income - expenses)]
  })

  autoTable(doc, {
    startY: y,
    head: [['Month', 'Income', 'Expenses', 'Net Savings']],
    body: monthlyData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'right', textColor: [22, 163, 74] },
      2: { halign: 'right', textColor: [220, 38, 38] },
      3: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── Spending by category ───────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  y = addSectionTitle(doc, 'Spending Breakdown — This Month', y)

  const catData = Object.entries(stats?.byCategory || {})
    .map(([id, amount]) => {
      const cat = getCategoryById(id)
      return [cat.label, fmt(amount)]
    })
    .sort((a, b) => {
      // Sort descending by raw amount (re-parse since formatted)
      const aAmt = Object.entries(stats?.byCategory || {}).find(([id]) => getCategoryById(id).label === a[0])?.[1] || 0
      const bAmt = Object.entries(stats?.byCategory || {}).find(([id]) => getCategoryById(id).label === b[0])?.[1] || 0
      return bAmt - aAmt
    })

  if (catData.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('No spending data for this month.', 14, y + 4)
    y += 12
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount']],
      body: catData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Budget utilization ─────────────────────────────────────────────────────
  if (budgets.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }
    y = addSectionTitle(doc, 'Budget Utilization', y)

    const budgetRows = (stats?.budgetUtil || []).map(b => {
      const pct = Math.round((b.pct || 0) * 100)
      return [b.category, fmt(b.spent), fmt(b.limit), `${pct}%`, pct >= 100 ? 'Over Budget' : pct >= 80 ? 'Near Limit' : 'On Track']
    })

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Spent', 'Limit', 'Used', 'Status']],
      body: budgetRows,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'center' },
      },
      didParseCell(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.raw
          data.cell.styles.textColor = val === 'Over Budget' ? [220, 38, 38] : val === 'Near Limit' ? [234, 88, 12] : [22, 163, 74]
        }
      },
      margin: { left: 14, right: 14 },
    })
  }

  addFooter(doc)
  doc.save(`FinanceVault-Report-${format(now, 'yyyy-MM-dd')}.pdf`)
}

// ─── Transactions Export ───────────────────────────────────────────────────────

export function exportTransactionsPdf(transactions, accounts) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const now = new Date()

  addHeader(doc, 'Transaction History', `${transactions.length} transactions`)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)

  let y = 36

  // Quick summary strip
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(22, 163, 74)
  doc.text(`Income: ${fmt(totalIncome)}`, 14, y)
  doc.setTextColor(220, 38, 38)
  doc.text(`Expenses: ${fmt(totalExpenses)}`, 80, y)
  doc.setTextColor(30, 41, 59)
  doc.text(`Net: ${fmt(totalIncome - totalExpenses)}`, 155, y)
  y += 8

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]))

  const rows = [...transactions]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(tx => {
      const cat = getCategoryById(tx.category)
      return [
        tx.date || '—',
        tx.description || 'Transaction',
        cat.label,
        tx.type === 'income' ? 'Income' : 'Expense',
        accountMap[tx.account] || '—',
        tx.type === 'income' ? fmt(tx.amount) : `-${fmt(tx.amount)}`,
      ]
    })

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Description', 'Category', 'Type', 'Account', 'Amount']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 60 },
      2: { cellWidth: 32 },
      3: { cellWidth: 22 },
      4: { cellWidth: 30 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
    },
    didParseCell(data) {
      if (data.column.index === 5 && data.section === 'body') {
        const isExpense = String(data.cell.raw).startsWith('-')
        data.cell.styles.textColor = isExpense ? [220, 38, 38] : [22, 163, 74]
      }
    },
    margin: { left: 14, right: 14 },
  })

  addFooter(doc)
  doc.save(`FinanceVault-Transactions-${format(now, 'yyyy-MM-dd')}.pdf`)
}

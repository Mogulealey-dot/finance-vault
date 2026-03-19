import { useState } from 'react'
import Layout from './components/layout/Layout'
import { useFinance } from './hooks/useFinance'
import { useFirestore } from './hooks/useFirestore'
import { useAlerts } from './hooks/useAlerts'
import { useToast } from './hooks/useToast'
import Toast from './components/common/Toast'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetPage from './pages/BudgetPage'
import AccountsPage from './pages/AccountsPage'
import InvestmentsPage from './pages/InvestmentsPage'
import BillsPage from './pages/BillsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

export default function App({ user, logOut }) {
  const [activePage, setActivePage] = useState('dashboard')
  const uid = user?.uid

  const {
    transactions, txLoading, addTx, updateTx, removeTx,
    accounts, acLoading, addAccount, updateAccount, removeAccount,
    budgets, addBudget, updateBudget, removeBudget,
    bills, addBill, updateBill, removeBill,
    investments, addInvestment, updateInvestment, removeInvestment,
    thisMonthTx, stats,
  } = useFinance(uid)

  const { data: settingsArr, add: addSettings, update: updateSettingsDoc } = useFirestore(uid, 'settings')
  const settings = settingsArr[0] || {}
  const updateSettings = async (data) => {
    if (settingsArr[0]) await updateSettingsDoc(settingsArr[0].id, data)
    else await addSettings(data)
  }

  const { alerts, alertsByPage } = useAlerts({ stats, accounts, bills })
  const { toasts, show: showToast, remove: removeToast } = useToast()

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} stats={stats} alerts={alerts} accounts={accounts} thisMonthTx={thisMonthTx} loading={txLoading || acLoading} onNavigate={setActivePage} />
      case 'transactions':
        return <TransactionsPage uid={uid} transactions={transactions} accounts={accounts} addTx={addTx} updateTx={updateTx} removeTx={removeTx} showToast={showToast} />
      case 'budget':
        return <BudgetPage budgets={budgets} addBudget={addBudget} updateBudget={updateBudget} removeBudget={removeBudget} stats={stats} showToast={showToast} />
      case 'accounts':
        return <AccountsPage accounts={accounts} addAccount={addAccount} updateAccount={updateAccount} removeAccount={removeAccount} showToast={showToast} />
      case 'investments':
        return <InvestmentsPage investments={investments} addInvestment={addInvestment} updateInvestment={updateInvestment} removeInvestment={removeInvestment} accounts={accounts} showToast={showToast} />
      case 'bills':
        return <BillsPage bills={bills} addBill={addBill} updateBill={updateBill} removeBill={removeBill} showToast={showToast} />
      case 'reports':
        return <ReportsPage transactions={transactions} accounts={accounts} budgets={budgets} stats={stats} showToast={showToast} />
      case 'settings':
        return <SettingsPage user={user} settings={settings} updateSettings={updateSettings} logOut={logOut} showToast={showToast} />
      default:
        return <DashboardPage user={user} stats={stats} alerts={alerts} accounts={accounts} thisMonthTx={thisMonthTx} loading={txLoading || acLoading} onNavigate={setActivePage} />
    }
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} alertsByPage={alertsByPage} alertCount={alerts.length} user={user}>
      {renderPage()}
      <Toast toasts={toasts} remove={removeToast} />
    </Layout>
  )
}

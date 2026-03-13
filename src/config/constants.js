export const APP_NAME = 'FinanceVault'

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
]

export const BUDGET_METHODS = [
  { id: 'zero', label: 'Zero-Based', description: 'Every dollar gets a job — income minus expenses = $0' },
  { id: '50_30_20', label: '50/30/20 Rule', description: '50% needs, 30% wants, 20% savings' },
  { id: 'envelope', label: 'Envelope Method', description: 'Allocate cash into spending envelopes per category' },
  { id: 'custom', label: 'Custom', description: 'Set your own budget targets per category' },
]

export const ACCOUNT_TYPES = [
  { id: 'checking', label: 'Checking', icon: '🏦' },
  { id: 'savings', label: 'Savings', icon: '💰' },
  { id: 'credit', label: 'Credit Card', icon: '💳' },
  { id: 'investment', label: 'Investment', icon: '📈' },
  { id: 'retirement', label: 'Retirement (401k/IRA)', icon: '🏖️' },
  { id: 'loan', label: 'Loan / Debt', icon: '📋' },
  { id: 'crypto', label: 'Crypto', icon: '🪙' },
  { id: 'cash', label: 'Cash', icon: '💵' },
]

export const RECURRENCE = ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually']

export const ALERT_THRESHOLDS = {
  budgetWarning: 0.8,   // 80% of budget used → warning
  budgetOver: 1.0,      // 100% → over budget
  billDueSoon: 3,       // days before due → alert
  lowBalance: 100,      // dollars below → alert
}

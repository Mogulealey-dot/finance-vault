export const TRANSACTION_CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: '🏠', color: '#6366f1', subcategories: ['Rent/Mortgage', 'Utilities', 'Insurance', 'Repairs'] },
  { id: 'food', label: 'Food & Dining', icon: '🍽️', color: '#f59e0b', subcategories: ['Groceries', 'Restaurants', 'Coffee', 'Fast Food'] },
  { id: 'transport', label: 'Transportation', icon: '🚗', color: '#10b981', subcategories: ['Gas', 'Car Payment', 'Insurance', 'Public Transit', 'Rideshare'] },
  { id: 'health', label: 'Health & Fitness', icon: '💪', color: '#ef4444', subcategories: ['Medical', 'Pharmacy', 'Gym', 'Mental Health'] },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#8b5cf6', subcategories: ['Clothing', 'Electronics', 'Home Goods', 'Personal Care'] },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#ec4899', subcategories: ['Streaming', 'Movies', 'Events', 'Hobbies', 'Gaming'] },
  { id: 'subscriptions', label: 'Subscriptions', icon: '🔄', color: '#06b6d4', subcategories: ['Streaming', 'Software', 'News', 'Memberships'] },
  { id: 'education', label: 'Education', icon: '📚', color: '#84cc16', subcategories: ['Tuition', 'Books', 'Courses', 'Student Loans'] },
  { id: 'savings', label: 'Savings & Investing', icon: '📈', color: '#22c55e', subcategories: ['Emergency Fund', '401k', 'IRA', 'Brokerage', 'Crypto'] },
  { id: 'income', label: 'Income', icon: '💰', color: '#16a34a', subcategories: ['Salary', 'Freelance', 'Dividends', 'Rental', 'Refunds'] },
  { id: 'bills', label: 'Bills & Utilities', icon: '📄', color: '#f97316', subcategories: ['Phone', 'Internet', 'Electric', 'Water', 'Gas'] },
  { id: 'travel', label: 'Travel', icon: '✈️', color: '#0ea5e9', subcategories: ['Flights', 'Hotels', 'Vacation', 'Car Rental'] },
  { id: 'gifts', label: 'Gifts & Donations', icon: '🎁', color: '#d946ef', subcategories: ['Gifts', 'Charity', 'Church'] },
  { id: 'other', label: 'Other', icon: '📌', color: '#94a3b8', subcategories: ['Miscellaneous', 'ATM/Cash', 'Fees'] },
]

export const getCategoryById = (id) => TRANSACTION_CATEGORIES.find(c => c.id === id) || TRANSACTION_CATEGORIES[TRANSACTION_CATEGORIES.length - 1]

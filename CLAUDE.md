# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
```

## Firebase Setup

Copy `.env.example` → `.env` and fill in your Firebase project credentials. Create a Firebase project with:
- Authentication (Email/Password + Google)
- Firestore Database

## Architecture

**FinanceVault** is a personal finance management app built with React 19 + Vite (plain JSX, no TypeScript), backed by Firebase (Auth + Firestore). Follows the same patterns as HomeVault.

### Entry Points
- `src/main.jsx` → mounts `Root`
- `src/Root.jsx` → auth gate (shows `AuthScreen` or `App`)
- `src/App.jsx` → main shell with sidebar, routes between pages via `activePage` state
- `src/pages/*Page.jsx` → one page component per section

### Data Layer
All data lives in Firestore under `users/{uid}/{collection}`:

| Collection | Contents |
|---|---|
| `transactions` | Income and expense transactions |
| `accounts` | Linked financial accounts (checking, savings, credit, investment) |
| `budgets` | Budget categories with monthly limits |
| `bills` | Recurring bills and subscriptions |
| `investments` | Investment holdings (stocks, ETFs, crypto) |
| `settings` | User preferences |

`useFirestore(uid, collectionName)` provides real-time `onSnapshot` subscriptions + CRUD.

### Key Hooks
- `useAuth()` — Firebase auth state, signIn, signUp, signOut, Google auth
- `useFirestore(uid, col)` — real-time CRUD for any Firestore collection
- `useFinance(uid)` — wraps all finance collections with computed stats (monthly income/expenses, net worth, budget utilization, upcoming bills)
- `useAlerts(...)` — cross-collection alert computation

### Feature Modules
| Section | Page | Key Features |
|---|---|---|
| Dashboard | DashboardPage | Net worth, income/expense summary, AI insights, 7-day trend chart |
| Transactions | TransactionsPage | Add/edit/filter income & expenses, categorization |
| Budget | BudgetPage | Zero-based budgeting, progress bars, over-budget alerts |
| Accounts | AccountsPage | Net worth tracking, all account types |
| Investments | InvestmentsPage | Portfolio tracking, gain/loss, pie chart allocation |
| Bills & Subs | BillsPage | Recurring payment tracking, subscription detection, due date alerts |
| Insights | ReportsPage | Financial health score, 6-month trends, spending breakdown |
| Settings | SettingsPage | Currency, budget method, profile, security info |

export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: number;
  company: number;
  company_name: string;
  user: number;
  username: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface NoteCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
  note_count?: number;
  created_at: string;
}

export interface Note {
  id: number;
  category: number | null;
  category_name?: string;
  category_color?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface PlanCategory {
  id: number;
  name: string;
  created_at: string;
}

export interface PlanSubCategory {
  id: number;
  category: number;
  category_name?: string;
  name: string;
  created_at: string;
}

export interface Plan {
  id: number;
  category: number | null;
  category_name?: string;
  sub_category: number | null;
  sub_category_name?: string;
  item_name: string;
  amount: string;
  description: string;
  target_date: string;
  is_realized: boolean;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceAccount {
  id: number;
  name: string;
  type: 'bank' | 'e_wallet' | 'cash' | 'credit_card' | 'paylater' | 'investment' | 'other';
  balance_type: 'personal' | 'office';
  initial_balance: string;
  balance_date: string | null;
  current_balance: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  type: 'expense' | 'income';
  category: number | null;
  category_name: string;
  finance_account?: number | null;
  finance_account_name?: string;
  amount: string;
  description: string;
  payment_method: string;
  balance_type: 'personal' | 'office';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  category: number;
  category_name: string;
  amount: string;
  month: number;
  year: number;
  spent: string;
  percentage: number;
  daily_limit?: string;
  daily_spent?: string;
  daily_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardData {
  total_income: string;
  total_expense: string;
  balance: string;
  personal_balance: string;
  office_balance: string;
  accounts: FinanceAccount[];
  recent_transactions: Transaction[];
  spending_by_category: {
    category__name: string;
    category__color: string;
    total: string;
  }[];
  monthly_trend: {
    month: string;
    type: string;
    total: string;
  }[];
  daily_trend: {
    day: string;
    type: string;
    total: string;
  }[];
}

export interface UserSettings {
  payday_date: number;
  initial_personal_balance: string;
  initial_office_balance: string;
  reminder_enabled: boolean;
  reminder_hours: number;
}

export interface Debt {
  id: number;
  name: string;
  type: 'paylater' | 'credit_card' | 'loan' | 'installment' | 'other';
  total_amount: string;
  paid_amount: string;
  monthly_payment: string;
  due_date: number;
  notes: string;
  is_active: boolean;
  remaining: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: string;
  current_amount: string;
  deadline: string | null;
  color: string;
  is_completed: boolean;
  remaining: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export type FinanceAccountType = 'bank' | 'e_wallet' | 'cash' | 'credit_card' | 'paylater' | 'investment' | 'other';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'paylater' | 'e_wallet' | 'cod';
export type BalanceType = 'personal' | 'office';
export type TransactionType = 'expense' | 'income';
export type DebtType = 'paylater' | 'credit_card' | 'loan' | 'installment' | 'other';

export const FINANCE_ACCOUNT_TYPE_LABELS: Record<FinanceAccountType, string> = {
  bank: 'Bank',
  e_wallet: 'E-Wallet',
  cash: 'Tunai',
  credit_card: 'Kartu Kredit',
  paylater: 'Paylater',
  investment: 'Investasi',
  other: 'Lainnya',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Transfer Bank',
  credit_card: 'Kartu Kredit',
  paylater: 'Paylater',
  e_wallet: 'E-Wallet',
  cod: 'COD',
};

export const BALANCE_TYPE_LABELS: Record<BalanceType, string> = {
  personal: 'Pribadi',
  office: 'Lainnya',
};

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  paylater: 'Paylater',
  credit_card: 'Kartu Kredit',
  loan: 'Pinjaman',
  installment: 'Cicilan',
  other: 'Lainnya',
};

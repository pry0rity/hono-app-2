export interface Category {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
  type: 'expense' | 'income';
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CategoryBasic {
  id: number;
  name: string;
  color: string | null;
  icon: string | null;
}

export interface Expense {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  amount: string;
  type: 'expense' | 'income';
  date: string;
  categoryId: number;
  category: CategoryBasic | null;
  notes: string | null;
  status: 'cleared' | 'pending' | 'reconciled';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedResponse {
  pagination: {
    total: number;
    pages: number;
  };
}

export interface ExpenseResponse extends PaginatedResponse {
  expenses: Expense[];
}

export interface CategoryResponse {
  categories: Category[];
}

export interface CategorySpending {
  [category: string]: number;
}

export interface MonthlySpending {
  [month: number]: number;
}

export interface StatsResponse {
  last30Days: {
    income: string;
    expenses: string;
    net: string;
  };
  categoryBreakdown: Array<{
    category: Category;
    total: string;
    count: number;
  }>;
}

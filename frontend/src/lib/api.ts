import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (activeCompanyId && config.headers) {
      config.headers['X-Company-Id'] = activeCompanyId;
    }
  }
  return config;
});

// ========== Auth ==========
export const authLogin = (data: { username: string; password: string }) =>
  api.post('/auth/login/', data);

export const authRegister = (data: { username: string; email: string; password: string; first_name?: string }) =>
  api.post('/auth/register/', data);

export const authLogout = () => api.post('/auth/logout/');

export const authMe = () => api.get('/auth/me/');

export const updateProfile = (data: any) => {
  const isFormData = data instanceof FormData;
  return api.put('/auth/profile/', data, {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
  });
};

export const authForgotPassword = (email: string) =>
  api.post('/auth/forgot-password/', { email });

export const authVerifyOtp = (data: { email: string; code: string }) =>
  api.post('/auth/verify-otp/', data);

export const authResetPassword = (data: { email: string; code: string; new_password: string }) =>
  api.post('/auth/reset-password/', data);

// ========== Categories ==========
export const getCategories = (type?: string) =>
  api.get('/categories/', { params: type ? { type } : {} });

export const createCategory = (data: { name: string; type: string; icon?: string; color?: string }) =>
  api.post('/categories/', data);

export const updateCategory = (id: number, data: { name?: string; type?: string; icon?: string; color?: string }) =>
  api.put(`/categories/${id}/`, data);

export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}/`);

// ========== Transactions ==========
export const getTransactions = (params?: Record<string, string>) =>
  api.get('/transactions/', { params });

export const createTransaction = (data: Record<string, unknown>) =>
  api.post('/transactions/', data);

export const updateTransaction = (id: number, data: Record<string, unknown>) =>
  api.put(`/transactions/${id}/`, data);

export const deleteTransaction = (id: number) =>
  api.delete(`/transactions/${id}/`);

// ========== Budgets ==========
export const getBudgets = (params?: { month?: number; year?: number }) =>
  api.get('/budgets/', { params });

export const createBudget = (data: Record<string, unknown>) =>
  api.post('/budgets/', data);

export const updateBudget = (id: number, data: Record<string, unknown>) =>
  api.put(`/budgets/${id}/`, data);

export const deleteBudget = (id: number) =>
  api.delete(`/budgets/${id}/`);

// ========== Dashboard ==========
export const getDashboard = (params?: { month?: number; year?: number }) =>
  api.get('/dashboard/', { params });

// ========== User Settings ==========
export const getUserSettings = () => api.get('/settings/');

export const updateUserSettings = (data: Record<string, unknown>) =>
  api.put('/settings/', data);

// ========== Debts ==========
export const getDebts = (params?: { is_active?: string }) =>
  api.get('/debts/', { params });

export const createDebt = (data: Record<string, unknown>) =>
  api.post('/debts/', data);

export const updateDebt = (id: number, data: Record<string, unknown>) =>
  api.put(`/debts/${id}/`, data);

export const patchDebt = (id: number, data: Record<string, unknown>) =>
  api.patch(`/debts/${id}/`, data);

export const deleteDebt = (id: number) =>
  api.delete(`/debts/${id}/`);

// ========== Savings Goals ==========
export const getSavingsGoals = (params?: { is_completed?: string }) =>
  api.get('/savings-goals/', { params });

export const createSavingsGoal = (data: Record<string, unknown>) =>
  api.post('/savings-goals/', data);

export const updateSavingsGoal = (id: number, data: Record<string, unknown>) =>
  api.put(`/savings-goals/${id}/`, data);

export const patchSavingsGoal = (id: number, data: Record<string, unknown>) =>
  api.patch(`/savings-goals/${id}/`, data);

export const deleteSavingsGoal = (id: number) =>
  api.delete(`/savings-goals/${id}/`);

// ========== Finance Accounts ==========
export const getFinanceAccounts = (params?: { is_active?: string }) =>
  api.get('/finance-accounts/', { params });

export const createFinanceAccount = (data: Record<string, unknown>) =>
  api.post('/finance-accounts/', data);

export const updateFinanceAccount = (id: number, data: Record<string, unknown>) =>
  api.put(`/finance-accounts/${id}/`, data);

export const patchFinanceAccount = (id: number, data: Record<string, unknown>) =>
  api.patch(`/finance-accounts/${id}/`, data);

export const deleteFinanceAccount = (id: number) =>
  api.delete(`/finance-accounts/${id}/`);

// ========== Companies ==========
export const getCompanies = () => api.get('/companies/');
export const createCompany = (data: Record<string, unknown>) => api.post('/companies/', data);
export const updateCompany = (id: number, data: Record<string, unknown>) => api.put(`/companies/${id}/`, data);
export const deleteCompany = (id: number) => api.delete(`/companies/${id}/`);

// ========== Company Members ==========
export const getCompanyMembers = () => api.get('/company-members/');
export const createCompanyMember = (data: { email: string; company: number; role?: string }) => api.post('/company-members/', data);
export const updateCompanyMember = (id: number, data: Record<string, unknown>) => api.put(`/company-members/${id}/`, data);
export const deleteCompanyMember = (id: number) => api.delete(`/company-members/${id}/`);

// ========== Notes ==========
export const getNotes = (categoryId?: number) => 
  api.get('/notes/', { params: categoryId ? { category: categoryId } : {} });
export const createNote = (data: { title: string; content?: string; category?: number | null }) => api.post('/notes/', data);
export const updateNote = (id: number, data: { title?: string; content?: string; category?: number | null }) => api.put(`/notes/${id}/`, data);
export const deleteNote = (id: number) => api.delete(`/notes/${id}/`);

// ========== Note Categories ==========
export const getNoteCategories = () => api.get('/note-categories/');
export const createNoteCategory = (data: { name: string; color?: string; icon?: string }) => api.post('/note-categories/', data);
export const updateNoteCategory = (id: number, data: { name?: string; color?: string; icon?: string }) => api.put(`/note-categories/${id}/`, data);
export const deleteNoteCategory = (id: number) => api.delete(`/note-categories/${id}/`);

// ========== Plans ==========
export const getPlans = () => api.get('/plans/');
export const createPlan = (data: Record<string, unknown>) => api.post('/plans/', data);
export const updatePlan = (id: number, data: Record<string, unknown>) => api.put(`/plans/${id}/`, data);
export const patchPlan = (id: number, data: Record<string, unknown>) => api.patch(`/plans/${id}/`, data);
export const deletePlan = (id: number) => api.delete(`/plans/${id}/`);

// ========== Plan Categories ==========
export const getPlanCategories = () => api.get('/plan-categories/');
export const createPlanCategory = (data: { name: string }) => api.post('/plan-categories/', data);
export const getPlanSubCategories = (categoryId?: string) => api.get('/plan-subcategories/', { params: categoryId ? { category: categoryId } : {} });
export const createPlanSubCategory = (data: { category: number; name: string }) => api.post('/plan-subcategories/', data);

// ========== Export ==========
export const exportCsv = () =>
  api.get('/export/csv/', { responseType: 'blob' });

export default api;

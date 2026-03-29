from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')
router.register(r'budgets', views.BudgetViewSet, basename='budget')
router.register(r'debts', views.DebtViewSet, basename='debt')
router.register(r'savings-goals', views.SavingsGoalViewSet, basename='savings-goal')
router.register(r'finance-accounts', views.FinanceAccountViewSet, basename='finance-account')
router.register(r'companies', views.CompanyViewSet, basename='company')
router.register(r'company-members', views.CompanyMemberViewSet, basename='company-member')
router.register(r'notes', views.NoteViewSet, basename='note')
router.register(r'note-categories', views.NoteCategoryViewSet, basename='note-category')
router.register(r'plans', views.PlanViewSet, basename='plan')
router.register(r'plan-categories', views.PlanCategoryViewSet, basename='plan-category')
router.register(r'plan-subcategories', views.PlanSubCategoryViewSet, basename='plan-subcategory')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.dashboard, name='dashboard'),
    # Auth endpoints
    path('auth/login/', views.auth_login, name='auth-login'),
    path('auth/register/', views.auth_register, name='auth-register'),
    path('auth/logout/', views.auth_logout, name='auth-logout'),
    path('auth/me/', views.auth_me, name='auth-me'),
    path('auth/profile/', views.auth_update_profile, name='auth-update-profile'),
    path('auth/forgot-password/', views.auth_forgot_password, name='auth-forgot-password'),
    path('auth/verify-otp/', views.auth_verify_otp, name='auth-verify-otp'),
    path('auth/reset-password/', views.auth_reset_password, name='auth-reset-password'),
    # Settings
    path('settings/', views.user_settings_view, name='user-settings'),
    # Export
    path('export/csv/', views.export_transactions_csv, name='export-csv'),
]

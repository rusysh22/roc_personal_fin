from django.contrib import admin
from .models import Category, Transaction, Budget, PasswordResetOTP


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'user']
    list_filter = ['type']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'type', 'category', 'payment_method', 'date', 'user']
    list_filter = ['type', 'payment_method', 'balance_type', 'date']
    search_fields = ['description']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['category', 'amount', 'month', 'year', 'user']
    list_filter = ['month', 'year']


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ['email', 'code', 'created_at', 'is_used']
    list_filter = ['is_used']
    readonly_fields = ['created_at']

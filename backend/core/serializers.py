from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, Transaction, Budget, UserSettings, 
    Debt, SavingsGoal, FinanceAccount,
    Company, CompanyMember, Note, NoteCategory, Plan, PlanCategory, PlanSubCategory
)

class PlanCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanCategory
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['created_at']

class PlanSubCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = PlanSubCategory
        fields = ['id', 'category', 'category_name', 'name', 'created_at']
        read_only_fields = ['created_at']

class PlanSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    sub_category_name = serializers.CharField(source='sub_category.name', read_only=True)

    class Meta:
        model = Plan
        fields = [
            'id', 'category', 'category_name', 'sub_category', 'sub_category_name',
            'item_name', 'amount', 'description', 'target_date', 'google_event_id', 'is_realized',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_photo']

    def get_profile_photo(self, obj):
        if hasattr(obj, 'user_settings') and obj.user_settings.profile_photo:
            return obj.user_settings.profile_photo.url
        return None


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'icon', 'color']


class FinanceAccountSerializer(serializers.ModelSerializer):
    current_balance = serializers.SerializerMethodField()

    class Meta:
        model = FinanceAccount
        fields = [
            'id', 'user', 'company', 'name', 'type', 'balance_type', 
            'initial_balance', 'balance_date', 'current_balance', 'color', 
            'is_active', 'include_in_dashboard', 'statement_day', 'due_day',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_current_balance(self, obj):
        return str(obj.current_balance)


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class CompanyMemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = CompanyMember
        fields = ['id', 'company', 'company_name', 'user', 'username', 'email', 'role', 'joined_at']
        read_only_fields = ['joined_at']


class NoteCategorySerializer(serializers.ModelSerializer):
    note_count = serializers.IntegerField(source='notes.count', read_only=True)

    class Meta:
        model = NoteCategory
        fields = ['id', 'name', 'color', 'icon', 'note_count', 'created_at']
        read_only_fields = ['created_at']


class NoteSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'category', 'category_name', 'category_color', 'title', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    finance_account_name = serializers.CharField(source='finance_account.name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'company', 'company_name', 'type', 'category', 'category_name', 
            'finance_account', 'finance_account_name', 'amount', 'description', 
            'payment_method', 'balance_type', 'installments', 'date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True, default=0)
    percentage = serializers.FloatField(read_only=True, default=0)

    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'amount',
            'month', 'year', 'spent', 'percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class DashboardSerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=15, decimal_places=2)
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    personal_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    office_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    recent_transactions = TransactionSerializer(many=True)
    spending_by_category = serializers.ListField()
    monthly_trend = serializers.ListField()


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'profile_photo', 'payday_date', 'initial_personal_balance',
            'initial_office_balance', 'reminder_enabled',
            'reminder_hours',
        ]


class DebtSerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Debt
        fields = [
            'id', 'name', 'type', 'total_amount', 'paid_amount',
            'monthly_payment', 'due_date', 'notes', 'is_active',
            'remaining', 'progress_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class SavingsGoalSerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'name', 'target_amount', 'current_amount',
            'deadline', 'color', 'is_completed',
            'remaining', 'progress_percentage',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

from django.db import models
from django.contrib.auth.models import User


class PasswordResetOTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.code} for {self.email}"


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_settings')
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    payday_date = models.IntegerField(default=1)  # 1-31
    initial_personal_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    initial_office_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reminder_enabled = models.BooleanField(default=True)
    reminder_hours = models.IntegerField(default=12)

    def __str__(self):
        return f"Settings for {self.user.username}"


class Category(models.Model):
    CATEGORY_TYPES = [
        ('expense', 'Pengeluaran'),
        ('income', 'Pemasukan'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    company = models.ForeignKey('Company', on_delete=models.CASCADE, null=True, blank=True, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=7, blank=True, default='#6366f1')

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Company(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class CompanyMember(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='company_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('company', 'user')
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user.username} - {self.company.name} ({self.role})"


class NoteCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_categories')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='note_categories')
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, blank=True, default='#6366f1')
    icon = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'note categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='notes')
    category = models.ForeignKey(NoteCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='notes')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class FinanceAccount(models.Model):
    ACCOUNT_TYPES = [
        ('bank', 'Bank'),
        ('e_wallet', 'E-Wallet'),
        ('cash', 'Tunai'),
        ('investment', 'Investasi'),
        ('other', 'Lainnya'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='finance_accounts')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='finance_accounts')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='bank')
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    color = models.CharField(max_length=7, blank=True, default='#3b82f6')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - Rp {self.initial_balance:,.0f}"

    @property
    def current_balance(self):
        from django.db.models import Sum
        income = self.transactions.filter(type='income').aggregate(t=Sum('amount'))['t'] or 0
        expense = self.transactions.filter(type='expense').aggregate(t=Sum('amount'))['t'] or 0
        return self.initial_balance + income - expense


class Transaction(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Transfer Bank'),
        ('credit_card', 'Kartu Kredit'),
        ('paylater', 'Paylater'),
        ('e_wallet', 'E-Wallet'),
        ('cod', 'COD'),
    ]

    TRANSACTION_TYPES = [
        ('expense', 'Pengeluaran'),
        ('income', 'Pemasukan'),
    ]

    BALANCE_TYPES = [
        ('personal', 'Pribadi'),
        ('office', 'Lainnya'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='transactions')
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    finance_account = models.ForeignKey(FinanceAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    balance_type = models.CharField(max_length=10, choices=BALANCE_TYPES, default='personal')
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} - Rp {self.amount:,.0f}"


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'user', 'category', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"{self.category.name} - {self.month}/{self.year} - Rp {self.amount:,.0f}"


class PlanCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_categories')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='plan_categories')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class PlanSubCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_subcategories')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='plan_subcategories')
    category = models.ForeignKey(PlanCategory, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Plan(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plans')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='plans')
    
    # Master data relations
    category = models.ForeignKey(PlanCategory, on_delete=models.PROTECT, related_name='plans', null=True, blank=True)
    sub_category = models.ForeignKey(PlanSubCategory, on_delete=models.PROTECT, related_name='plans', null=True, blank=True)
    
    item_name = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField(blank=True, default='')
    target_date = models.DateField()
    is_realized = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['target_date', '-created_at']

    def __str__(self):
        return f"{self.item_name} - Rp {self.amount:,.0f}"


class Debt(models.Model):
    DEBT_TYPES = [
        ('paylater', 'Paylater'),
        ('credit_card', 'Kartu Kredit'),
        ('loan', 'Pinjaman'),
        ('installment', 'Cicilan'),
        ('other', 'Lainnya'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='debts')
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=DEBT_TYPES, default='other')
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    monthly_payment = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    due_date = models.IntegerField(default=1)  # day of month (1-31)
    notes = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - Rp {self.total_amount:,.0f}"

    @property
    def remaining(self):
        return self.total_amount - self.paid_amount

    @property
    def progress_percentage(self):
        if self.total_amount > 0:
            return float(self.paid_amount / self.total_amount * 100)
        return 0


class SavingsGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='savings_goals')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='savings_goals')
    name = models.CharField(max_length=200)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    deadline = models.DateField(null=True, blank=True)
    color = models.CharField(max_length=7, blank=True, default='#0d9488')
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - Rp {self.target_amount:,.0f}"

    @property
    def remaining(self):
        return self.target_amount - self.current_amount

    @property
    def progress_percentage(self):
        if self.target_amount > 0:
            return float(self.current_amount / self.target_amount * 100)
        return 0

import csv
import random
import calendar
from datetime import date, timedelta
from decimal import Decimal
from dateutil.relativedelta import relativedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum, Q, Value, DecimalField, F, Count
from django.db.models.functions import TruncMonth, TruncDate, Coalesce
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .authentication import JWTAuthentication, generate_access_token, generate_refresh_token, decode_token


API_AUTH = [JWTAuthentication]

from .models import Category, Transaction, Budget, PasswordResetOTP, UserSettings, Debt, SavingsGoal, FinanceAccount, Company, CompanyMember, Note, NoteCategory, Plan, PlanCategory, PlanSubCategory
from .serializers import (
    UserSerializer,
    CategorySerializer,
    TransactionSerializer,
    BudgetSerializer,
    UserSettingsSerializer,
    DebtSerializer,
    SavingsGoalSerializer,
    FinanceAccountSerializer,
    CompanySerializer,
    CompanyMemberSerializer,
    NoteSerializer,
    NoteCategorySerializer,
    PlanSerializer,
    PlanCategorySerializer,
    PlanSubCategorySerializer,
)

class PlanCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = PlanCategorySerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        return PlanCategory.objects.filter(**get_company_filter_kwargs(self.request))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

class PlanSubCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSubCategorySerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = PlanSubCategory.objects.filter(**get_company_filter_kwargs(self.request))
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        return Plan.objects.filter(**get_company_filter_kwargs(self.request))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

class NoteCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = NoteCategorySerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        return NoteCategory.objects.filter(**get_company_filter_kwargs(self.request)).annotate(note_count=Count('notes'))

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = Note.objects.filter(**get_company_filter_kwargs(self.request))
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        return Company.objects.filter(members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        company = serializer.save()
        # Automatically make creator the owner
        CompanyMember.objects.create(
            company=company,
            user=self.request.user,
            role='owner'
        )

class CompanyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyMemberSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        return CompanyMember.objects.filter(
            company__members__user=self.request.user
        ).distinct()
        
    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        company_id = request.data.get('company')
        role = request.data.get('role', 'member')
        
        if not email or not company_id:
            return Response({'error': 'Email and company are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            target_user = User.objects.get(email=email)
            company = Company.objects.filter(id=company_id, members__user=request.user).first()
            if not company:
                return Response({'error': 'Company not found or access denied'}, status=status.HTTP_403_FORBIDDEN)
                
            member, created = CompanyMember.objects.get_or_create(
                company=company,
                user=target_user,
                defaults={'role': role}
            )
            
            if not created:
                member.role = role
                member.save()
                
            serializer = self.get_serializer(member)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            return Response({'error': 'User not found. Invite them to sign up first.'}, status=status.HTTP_404_NOT_FOUND)


# ==================== AUTH VIEWS ====================

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username dan password wajib diisi'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'error': 'Username atau password salah'}, status=401)

    serializer = UserSerializer(user, context={'request': request})
    return Response({
        'user': serializer.data,
        'access_token': generate_access_token(user),
        'refresh_token': generate_refresh_token(user),
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_register(request):
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    first_name = request.data.get('first_name', '').strip()

    if not username or not password or not email:
        return Response({'error': 'Username, email, dan password wajib diisi'}, status=400)

    if len(password) < 6:
        return Response({'error': 'Password minimal 6 karakter'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username sudah digunakan'}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email sudah terdaftar'}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
    )

    # Create default categories for new user
    _seed_default_categories(user)

    serializer = UserSerializer(user, context={'request': request})
    return Response({
        'user': serializer.data,
        'access_token': generate_access_token(user),
        'refresh_token': generate_refresh_token(user),
    }, status=201)


def _seed_default_categories(user):
    """Create default categories for a new user."""
    expense_cats = [
        ('Makanan & Minuman', '#ef4444'),
        ('Transportasi', '#3b82f6'),
        ('Belanja', '#8b5cf6'),
        ('Tagihan', '#f59e0b'),
        ('Kesehatan', '#10b981'),
        ('Pendidikan', '#6366f1'),
        ('Hiburan', '#ec4899'),
        ('Bensin', '#f97316'),
        ('Internet & Pulsa', '#14b8a6'),
        ('Groceries', '#84cc16'),
        ('Kopi', '#92400e'),
        ('Lainnya', '#64748b'),
    ]
    income_cats = [
        ('Gaji', '#10b981'),
        ('Freelance', '#3b82f6'),
        ('Investasi', '#8b5cf6'),
        ('Bonus', '#f59e0b'),
    ]
    for name, color in expense_cats:
        Category.objects.get_or_create(user=user, name=name, type='expense', defaults={'color': color})
    for name, color in income_cats:
        Category.objects.get_or_create(user=user, name=name, type='income', defaults={'color': color})


@api_view(['POST'])
@authentication_classes(API_AUTH)
def auth_logout(request):
    # JWT is stateless — client just discards the token
    return Response({'message': 'Berhasil logout'})


@api_view(['GET'])
@authentication_classes(API_AUTH)
def auth_me(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Tidak terautentikasi'}, status=401)
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT'])
@authentication_classes(API_AUTH)
def auth_update_profile(request):
    """Update user profile (first_name, last_name, email, password)."""
    if not request.user.is_authenticated:
        return Response({'error': 'Tidak terautentikasi'}, status=401)

    user = request.user
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    email = request.data.get('email', '').strip()
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')

    # Update basic fields
    if first_name:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email:
        # Check if email is already taken by another user
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({'error': 'Email sudah digunakan oleh akun lain'}, status=400)
        user.email = email

    # Update password if requested
    if new_password:
        if not current_password:
            return Response({'error': 'Password saat ini wajib diisi untuk mengubah password'}, status=400)
        if not user.check_password(current_password):
            return Response({'error': 'Password saat ini salah'}, status=400)
        if len(new_password) < 6:
            return Response({'error': 'Password baru minimal 6 karakter'}, status=400)
        user.set_password(new_password)

    user.save()

    # Handle Profile Photo
    if 'profile_photo' in request.FILES:
        settings_obj, _ = UserSettings.objects.get_or_create(user=user)
        settings_obj.profile_photo = request.FILES['profile_photo']
        settings_obj.save()

    serializer = UserSerializer(user, context={'request': request})
    data = serializer.data

    # If password changed, return new tokens (old ones are invalidated by timing)
    if new_password:
        data['access_token'] = generate_access_token(user)
        data['refresh_token'] = generate_refresh_token(user)

    return Response(data)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_forgot_password(request):
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'error': 'Email wajib diisi'}, status=400)

    if not User.objects.filter(email=email).exists():
        # Don't reveal whether email exists
        return Response({'message': 'Jika email terdaftar, kode OTP akan dikirim'})

    # Generate 6-digit OTP
    code = ''.join([str(random.randint(0, 9)) for _ in range(6)])

    # Invalidate previous unused OTPs for this email
    PasswordResetOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    # Create new OTP
    PasswordResetOTP.objects.create(email=email, code=code)

    # Send email
    try:
        send_mail(
            subject='RN Apps - Kode Reset Password',
            message=f'Kode OTP Anda untuk reset password: {code}\n\nKode ini berlaku selama 10 menit.\n\nJika Anda tidak meminta reset password, abaikan email ini.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        pass  # Email send failed silently; user will not receive OTP

    return Response({'message': 'Jika email terdaftar, kode OTP akan dikirim'})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_verify_otp(request):
    email = request.data.get('email', '').strip()
    code = request.data.get('code', '').strip()

    if not email or not code:
        return Response({'error': 'Email dan kode OTP wajib diisi'}, status=400)

    # Check OTP (valid for 10 minutes)
    ten_mins_ago = timezone.now() - timedelta(minutes=10)
    otp = PasswordResetOTP.objects.filter(
        email=email,
        code=code,
        is_used=False,
        created_at__gte=ten_mins_ago,
    ).first()

    if not otp:
        return Response({'error': 'Kode OTP tidak valid atau sudah kedaluwarsa'}, status=400)

    return Response({'message': 'Kode OTP valid', 'valid': True})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_reset_password(request):
    email = request.data.get('email', '').strip()
    code = request.data.get('code', '').strip()
    new_password = request.data.get('new_password', '')

    if not email or not code or not new_password:
        return Response({'error': 'Semua field wajib diisi'}, status=400)

    if len(new_password) < 6:
        return Response({'error': 'Password minimal 6 karakter'}, status=400)

    # Verify OTP again
    ten_mins_ago = timezone.now() - timedelta(minutes=10)
    otp = PasswordResetOTP.objects.filter(
        email=email,
        code=code,
        is_used=False,
        created_at__gte=ten_mins_ago,
    ).first()

    if not otp:
        return Response({'error': 'Kode OTP tidak valid atau sudah kedaluwarsa'}, status=400)

    # Reset password
    user = User.objects.filter(email=email).first()
    if not user:
        return Response({'error': 'User tidak ditemukan'}, status=404)

    user.set_password(new_password)
    user.save()

    # Mark OTP as used
    otp.is_used = True
    otp.save()

    return Response({'message': 'Password berhasil direset'})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def auth_refresh_token(request):
    refresh_token = request.data.get('refresh_token', '')
    if not refresh_token:
        return Response({'error': 'Refresh token wajib diisi'}, status=400)

    try:
        payload = decode_token(refresh_token)
    except Exception:
        return Response({'error': 'Refresh token tidak valid atau sudah kedaluwarsa'}, status=401)

    if payload.get('type') != 'refresh':
        return Response({'error': 'Token type tidak valid'}, status=401)

    try:
        user = User.objects.get(id=payload['user_id'])
    except User.DoesNotExist:
        return Response({'error': 'User tidak ditemukan'}, status=401)

    return Response({
        'access_token': generate_access_token(user),
        'refresh_token': generate_refresh_token(user),
    })


def get_company_filter_kwargs(request):
    """Return filter kwargs for company-aware queries.
    If a company is selected: filter by company only (all members see shared data).
    If no company: filter by user only (personal data).
    Result is cached on the request object to avoid repeated DB hits per request.
    """
    cached = getattr(request, '_company_filter_cache', None)
    if cached is not None:
        return cached

    company_id = request.headers.get('X-Company-Id')
    if company_id:
        is_member = CompanyMember.objects.filter(
            company_id=company_id, user=request.user
        ).exists()
        if is_member:
            result = {'company_id': company_id}
            request._company_filter_cache = result
            return result
    result = {'user': request.user, 'company__isnull': True}
    request._company_filter_cache = result
    return result

def get_company_create_kwargs(request):
    company_id = request.headers.get('X-Company-Id')
    return {'company_id': company_id} if company_id else {'company_id': None}


def annotate_account_balance(qs):
    """Annotate FinanceAccount queryset with computed_balance using reverse relation.
    Falls back to current_balance property in serializer for accounts with balance_date.
    """
    return qs.annotate(
        _tx_income=Coalesce(
            Sum('transactions__amount', filter=Q(transactions__type='income')),
            Value(0), output_field=DecimalField()
        ),
        _tx_expense=Coalesce(
            Sum('transactions__amount', filter=Q(transactions__type='expense')),
            Value(0), output_field=DecimalField()
        ),
        computed_balance=F('initial_balance') + F('_tx_income') - F('_tx_expense'),
    )

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = Category.objects.filter(**get_company_filter_kwargs(self.request))
        cat_type = self.request.query_params.get('type')
        if cat_type:
            qs = qs.filter(type=cat_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = Transaction.objects.filter(**get_company_filter_kwargs(self.request)).select_related('category', 'finance_account', 'company')
        params = self.request.query_params

        if params.get('type'):
            qs = qs.filter(type=params['type'])
        if params.get('category'):
            qs = qs.filter(category_id=params['category'])
        if params.get('payment_method'):
            qs = qs.filter(payment_method=params['payment_method'])
        if params.get('balance_type'):
            qs = qs.filter(balance_type=params['balance_type'])
        if params.get('date_from'):
            qs = qs.filter(date__gte=params['date_from'])
        if params.get('date_to'):
            qs = qs.filter(date__lte=params['date_to'])
        if params.get('min_amount'):
            qs = qs.filter(amount__gte=params['min_amount'])
        if params.get('max_amount'):
            qs = qs.filter(amount__lte=params['max_amount'])
        if params.get('search'):
            search = params['search']
            qs = qs.filter(Q(description__icontains=search) | Q(category__name__icontains=search))

        return qs

    def perform_create(self, serializer):
        transaction = serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))
        
        # Installment auto-generation logic
        installments = transaction.installments
        if installments > 1 and transaction.type == 'expense' and transaction.payment_method == 'credit_card':
            total_amount = transaction.amount
            # Split amount among installments
            installment_amount = (total_amount / Decimal(str(installments))).quantize(Decimal('0.01'))
            
            orig_description = transaction.description
            
            # Update the first installment (the one just created)
            transaction.amount = installment_amount
            transaction.description = f"{orig_description} (Cicilan 1/{installments})"
            transaction.save()
            
            # Create the remaining installments
            accumulated = installment_amount
            base_date = transaction.date
            for i in range(1, installments):
                current_installment_amount = installment_amount
                # Adjust last installment for any rounding remainder
                if i == installments - 1:
                    current_installment_amount = total_amount - accumulated
                
                accumulated += current_installment_amount
                next_date = base_date + relativedelta(months=i)
                
                Transaction.objects.create(
                    user=transaction.user,
                    company=transaction.company,
                    type=transaction.type,
                    category=transaction.category,
                    finance_account=transaction.finance_account,
                    amount=current_installment_amount,
                    description=f"{orig_description} (Cicilan {i+1}/{installments})",
                    payment_method=transaction.payment_method,
                    balance_type=transaction.balance_type,
                    installments=1, # Sub-transactions are single markers
                    date=next_date
                )


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = Budget.objects.filter(**get_company_filter_kwargs(self.request))
        params = self.request.query_params

        month = params.get('month', date.today().month)
        year = params.get('year', date.today().year)
        qs = qs.filter(month=month, year=year)

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        params = request.query_params
        month = int(params.get('month', date.today().month))
        year = int(params.get('year', date.today().year))

        today = date.today()
        days_in_month = calendar.monthrange(year, month)[1]
        company_filter = get_company_filter_kwargs(request)

        # Single aggregated query for monthly spend per category (replaces N per-budget queries)
        monthly_spent_qs = Transaction.objects.filter(
            **company_filter,
            type='expense',
            date__month=month,
            date__year=year,
        ).values('category_id').annotate(total=Sum('amount'))
        monthly_spent = {row['category_id']: row['total'] or Decimal('0') for row in monthly_spent_qs}

        # Single aggregated query for today's spend per category (only for current month)
        daily_spent_map: dict = {}
        if month == today.month and year == today.year:
            daily_qs = Transaction.objects.filter(
                **company_filter,
                type='expense',
                date=today,
            ).values('category_id').annotate(total=Sum('amount'))
            daily_spent_map = {row['category_id']: row['total'] or Decimal('0') for row in daily_qs}

        budgets = []
        for budget in queryset:
            spent = monthly_spent.get(budget.category_id, Decimal('0'))
            daily_spent = daily_spent_map.get(budget.category_id, Decimal('0'))
            daily_limit = float(budget.amount) / days_in_month
            percentage = float(spent / budget.amount * 100) if budget.amount > 0 else 0
            daily_percentage = float(float(daily_spent) / daily_limit * 100) if daily_limit > 0 else 0

            data = BudgetSerializer(budget).data
            data['spent'] = str(spent)
            data['percentage'] = round(percentage, 1)
            data['daily_limit'] = str(daily_limit)
            data['daily_spent'] = str(daily_spent)
            data['daily_percentage'] = round(daily_percentage, 1)
            budgets.append(data)

        return Response(budgets)


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def ping(_request):
    """Lightweight keep-alive endpoint for Vercel cold start prevention."""
    return Response({'status': 'ok'})


@api_view(['GET'])
@authentication_classes(API_AUTH)
def dashboard(request):
    today = date.today()
    month = int(request.query_params.get('month', today.month))
    year = int(request.query_params.get('year', today.year))

    transactions = Transaction.objects.filter(
        **get_company_filter_kwargs(request),
        date__month=month,
        date__year=year,
    )

    # Single aggregate query instead of 6 separate ones
    agg = transactions.aggregate(
        total_income=Coalesce(Sum('amount', filter=Q(type='income')), Value(0), output_field=DecimalField()),
        total_expense=Coalesce(Sum('amount', filter=Q(type='expense')), Value(0), output_field=DecimalField()),
        personal_income=Coalesce(Sum('amount', filter=Q(type='income', balance_type='personal')), Value(0), output_field=DecimalField()),
        personal_expense=Coalesce(Sum('amount', filter=Q(type='expense', balance_type='personal')), Value(0), output_field=DecimalField()),
        office_income=Coalesce(Sum('amount', filter=Q(type='income', balance_type='office')), Value(0), output_field=DecimalField()),
        office_expense=Coalesce(Sum('amount', filter=Q(type='expense', balance_type='office')), Value(0), output_field=DecimalField()),
    )
    total_income = agg['total_income']
    total_expense = agg['total_expense']

    # Spending by category
    spending_by_category = list(
        transactions.filter(type='expense')
        .values('category__name', 'category__color')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    # Monthly trend (last 6 months only)
    six_months_ago = date(year, month, 1) - timedelta(days=150)
    monthly_trend = list(
        Transaction.objects.filter(**get_company_filter_kwargs(request), date__gte=six_months_ago)
        .annotate(month=TruncMonth('date'))
        .values('month', 'type')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )

    # Daily trend (current selected month)
    daily_trend = list(
        transactions
        .annotate(day=TruncDate('date'))
        .values('day', 'type')
        .annotate(total=Sum('amount'))
        .order_by('day')
    )

    recent_transactions = transactions.select_related('category', 'finance_account').order_by('-date', '-created_at')[:5]

    accounts_list = list(
        annotate_account_balance(
            FinanceAccount.objects.filter(**get_company_filter_kwargs(request), is_active=True)
        )
    )
    accounts_data = FinanceAccountSerializer(accounts_list, many=True).data

    def _balance(acc):
        if not acc.balance_date and hasattr(acc, 'computed_balance') and acc.computed_balance is not None:
            return acc.computed_balance
        return acc.current_balance

    personal_account_balance = sum(
        _balance(acc) for acc in accounts_list if acc.balance_type == 'personal' and acc.include_in_dashboard
    )
    office_account_balance = sum(
        _balance(acc) for acc in accounts_list if acc.balance_type == 'office' and acc.include_in_dashboard
    )
    total_account_balance = personal_account_balance + office_account_balance
    has_accounts = len(accounts_list) > 0

    # Transaction-only balance fallback
    tx_personal_balance = agg['personal_income'] - agg['personal_expense']
    tx_office_balance = agg['office_income'] - agg['office_expense']
    has_personal_accounts = any(a.balance_type == 'personal' for a in accounts_list)
    has_office_accounts = any(a.balance_type == 'office' for a in accounts_list)

    response = Response({
        'total_income': str(total_income),
        'total_expense': str(total_expense),
        'balance': str(total_account_balance if has_accounts else total_income - total_expense),
        'personal_balance': str(personal_account_balance if has_personal_accounts else tx_personal_balance),
        'office_balance': str(office_account_balance if has_office_accounts else tx_office_balance),
        'accounts': accounts_data,
        'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
        'spending_by_category': spending_by_category,
        'monthly_trend': monthly_trend,
        'daily_trend': daily_trend,
    })
    response['Cache-Control'] = 'private, max-age=30'
    return response


# ==================== USER SETTINGS ====================

@api_view(['GET', 'PUT'])
@authentication_classes(API_AUTH)
def user_settings_view(request):
    """Get or update user settings (payday, balances, reminders)."""
    settings_obj, _ = UserSettings.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response(UserSettingsSerializer(settings_obj).data)

    # PUT
    serializer = UserSettingsSerializer(settings_obj, data=request.data, partial=True)
    if serializer.is_valid():
        # Validate payday_date range
        payday = serializer.validated_data.get('payday_date', settings_obj.payday_date)
        if payday < 1 or payday > 31:
            return Response({'error': 'Tanggal gajian harus antara 1-31'}, status=400)
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ==================== DEBTS ====================

class DebtViewSet(viewsets.ModelViewSet):
    serializer_class = DebtSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = Debt.objects.filter(**get_company_filter_kwargs(self.request))
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))


# ==================== SAVINGS GOALS ====================

class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = SavingsGoal.objects.filter(**get_company_filter_kwargs(self.request))
        is_completed = self.request.query_params.get('is_completed')
        if is_completed is not None:
            qs = qs.filter(is_completed=is_completed.lower() == 'true')
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto-mark as completed if target reached
        if instance.current_amount >= instance.target_amount:
            instance.is_completed = True
            instance.save()


# ==================== EXPORT DATA ====================

@api_view(['GET'])
@authentication_classes(API_AUTH)
def export_transactions_csv(request):
    """Export all user transactions as CSV."""
    transactions = Transaction.objects.filter(**get_company_filter_kwargs(request)).select_related('category', 'finance_account', 'company')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="transaksi_{request.user.username}_{date.today().isoformat()}.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Tanggal', 'Tipe', 'Kategori', 'Deskripsi',
        'Jumlah', 'Metode Pembayaran', 'Tipe Saldo',
    ])

    payment_labels = dict(Transaction.PAYMENT_METHODS)
    balance_labels = dict(Transaction.BALANCE_TYPES)

    for tx in transactions:
        writer.writerow([
            tx.date.isoformat(),
            'Pemasukan' if tx.type == 'income' else 'Pengeluaran',
            tx.category.name if tx.category else 'Tanpa Kategori',
            tx.description,
            str(tx.amount),
            payment_labels.get(tx.payment_method, tx.payment_method),
            balance_labels.get(tx.balance_type, tx.balance_type),
        ])

    return response

# ==================== FINANCE ACCOUNTS ====================

class FinanceAccountViewSet(viewsets.ModelViewSet):
    serializer_class = FinanceAccountSerializer
    authentication_classes = API_AUTH

    def get_queryset(self):
        qs = FinanceAccount.objects.filter(**get_company_filter_kwargs(self.request))
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return annotate_account_balance(qs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, **get_company_create_kwargs(self.request))


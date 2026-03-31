import os
import django
import sys
from decimal import Decimal
from datetime import date

# Setup Django environment
sys.path.append('d:/dani_coding/roc_personal_fin/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Transaction, FinanceAccount, Category, Company
from django.contrib.auth.models import User

def test_installments():
    print("Testing Installment Generation...")
    user = User.objects.first()
    category = Category.objects.filter(type='expense').first()
    account = FinanceAccount.objects.filter(type='credit_card').first()
    
    if not account:
        print("Creating dummy credit card account...")
        account = FinanceAccount.objects.create(
            user=user,
            name="Test CC",
            type="credit_card",
            initial_balance=0
        )

    # Clean up previous tests
    Transaction.objects.filter(description__contains="Cicilan Test").delete()

    print(f"Creating transaction: Rp 3.000.300 with 3 installments...")
    # Simulate perform_create logic
    from rest_framework.serializers import ReturnDict
    
    # We'll just call Transaction.objects.create and then manually run the logic 
    # OR we can simulate the ViewSet logic.
    
    # Let's just run the logic from views.py manually here as a verification of the logic itself
    total_amount = Decimal('3000300')
    installments = 3
    orig_description = "Cicilan Test"
    
    transaction = Transaction.objects.create(
        user=user,
        type='expense',
        category=category,
        finance_account=account,
        amount=total_amount,
        description=orig_description,
        payment_method='credit_card',
        date=date.today(),
        installments=installments
    )

    # The actual perform_create logic:
    from dateutil.relativedelta import relativedelta
    
    installment_amount = (total_amount / Decimal(str(installments))).quantize(Decimal('0.01'))
    
    transaction.amount = installment_amount
    transaction.description = f"{orig_description} (Cicilan 1/{installments})"
    transaction.save()
    
    accumulated = installment_amount
    base_date = transaction.date
    for i in range(1, installments):
        current_installment_amount = installment_amount
        if i == installments - 1:
            current_installment_amount = total_amount - accumulated
        
        accumulated += current_installment_amount
        next_date = base_date + relativedelta(months=i)
        
        Transaction.objects.create(
            user=transaction.user,
            type=transaction.type,
            category=transaction.category,
            finance_account=transaction.finance_account,
            amount=current_installment_amount,
            description=f"{orig_description} (Cicilan {i+1}/{installments})",
            payment_method=transaction.payment_method,
            balance_type=transaction.balance_type,
            installments=1,
            date=next_date
        )

    # Verify
    txs = Transaction.objects.filter(description__contains="Cicilan Test").order_by('date')
    print(f"Found {txs.count()} transactions.")
    for t in txs:
        print(f"- {t.date}: {t.description} -> {t.amount}")

    if txs.count() == 3:
        total_sum = sum(t.amount for t in txs)
        print(f"Total Sum: {total_sum}")
        if total_sum == total_amount:
            print("SUCCESS: Installments generated and summed correctly!")
        else:
            print(f"FAILURE: Sum mismatch! Expected {total_amount}, got {total_sum}")
    else:
        print(f"FAILURE: Expected 3 transactions, got {txs.count()}")

if __name__ == "__main__":
    test_installments()

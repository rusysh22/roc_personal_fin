import os
import sys
sys.path.append('d:\\dani_coding\\roc_personal_fin\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from core.models import User, Plan
user = User.objects.first()
try:
    Plan.objects.create(
        user=user,
        company_id=None,
        category='Test',
        item_name='Test',
        amount=5000000,
        target_date='2026-03-29'
    )
    print('SUCCESS')
except Exception as e:
    import traceback
    traceback.print_exc()

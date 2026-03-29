import os
import sys
sys.path.append('d:\\dani_coding\\roc_personal_fin\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.test import Client
from core.models import User
client = Client()
user = User.objects.first()
client.force_login(user)
response = client.post('/api/plans/', {
    'category': 'test',
    'sub_category': 'test',
    'item_name': 'test',
    'amount': 5000000,
    'description': '',
    'target_date': '2026-03-29'
}, content_type='application/json')
print('Status:', response.status_code)
if response.status_code != 201:
    print(response.content.decode())

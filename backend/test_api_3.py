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
try:
    response = client.post('/api/plans/', {
        'category': 'test',
        'sub_category': 'test',
        'item_name': 'test',
        'amount': 5000000,
        'description': '',
        'target_date': '2026-03-29'
    }, content_type='application/json', HTTP_HOST='localhost')
    print('Status:', response.status_code)
    if response.status_code != 201:
        if 'application/json' in response['Content-Type']:
            print(response.json())
        else:
            text = response.content.decode()
            if 'Exception Value:' in text:
                idx = text.find('Exception Value:')
                print(text[idx:idx+200])
            else:
                print(text[:200])
except Exception as e:
    import traceback
    traceback.print_exc()

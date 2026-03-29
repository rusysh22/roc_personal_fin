import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Run collectstatic at cold start (Vercel has read-only fs, uses /tmp)
from django.core.management import call_command
try:
    call_command('collectstatic', '--noinput', verbosity=0)
except Exception:
    pass

from config.wsgi import application

# App entry point for Vercel
app = application

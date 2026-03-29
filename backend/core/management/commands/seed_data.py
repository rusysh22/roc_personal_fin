from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Category


DEFAULT_CATEGORIES = [
    # Expenses
    ('Makan & Minum', 'expense', '#f43f5e'),
    ('Transportasi', 'expense', '#f59e0b'),
    ('Kopi', 'expense', '#8b5cf6'),
    ('Belanja Online', 'expense', '#3b82f6'),
    ('Tagihan', 'expense', '#ef4444'),
    ('Hiburan', 'expense', '#ec4899'),
    ('Pakaian', 'expense', '#14b8a6'),
    ('Kesehatan', 'expense', '#10b981'),
    ('Traktir', 'expense', '#f97316'),
    ('Zakat', 'expense', '#6366f1'),
    ('Jatah Keluarga', 'expense', '#a855f7'),
    ('Lainnya', 'expense', '#6b7280'),
    # Income
    ('Gaji', 'income', '#10b981'),
    ('Dana Lainnya', 'income', '#3b82f6'),
    ('Freelance', 'income', '#8b5cf6'),
    ('Lainnya', 'income', '#6b7280'),
]


class Command(BaseCommand):
    help = 'Seed initial user and categories'

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username='dani',
            defaults={'email': 'dani@example.com', 'is_staff': True},
        )
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created user: dani'))
        else:
            self.stdout.write('User dani already exists')

        count = 0
        for name, cat_type, color in DEFAULT_CATEGORIES:
            _, cat_created = Category.objects.get_or_create(
                user=user,
                name=name,
                type=cat_type,
                defaults={'color': color},
            )
            if cat_created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {count} categories'))

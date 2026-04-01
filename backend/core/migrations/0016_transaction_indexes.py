from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_financeaccount_due_day_financeaccount_statement_day_and_more'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['user', 'date'], name='tx_user_date_idx'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['company', 'date'], name='tx_company_date_idx'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['finance_account', 'type'], name='tx_account_type_idx'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=models.Index(fields=['date'], name='tx_date_idx'),
        ),
    ]

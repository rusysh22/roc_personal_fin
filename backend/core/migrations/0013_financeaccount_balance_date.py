from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_financeaccount_balance_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='financeaccount',
            name='balance_date',
            field=models.DateField(
                blank=True,
                help_text='Tanggal saldo awal berlaku',
                null=True,
            ),
        ),
    ]

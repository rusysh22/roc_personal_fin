from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_usersettings_profile_photo'),
    ]

    operations = [
        migrations.AddField(
            model_name='financeaccount',
            name='balance_type',
            field=models.CharField(
                choices=[('personal', 'Pribadi'), ('office', 'Lainnya')],
                default='personal',
                max_length=20,
            ),
        ),
    ]

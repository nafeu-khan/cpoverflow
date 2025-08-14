# Generated manually to add UserActivity model

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Only create the new UserActivity model, don't try to remove anything
        migrations.CreateModel(
            name='UserActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_online', models.BooleanField(default=False)),
                ('last_activity', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_seen', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='activity', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'User Activity',
                'verbose_name_plural': 'User Activities',
            },
        ),
    ]

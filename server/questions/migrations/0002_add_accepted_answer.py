from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('questions', '0001_initial'),
        ('answers', '0001_initial'),
    ]
    operations = [
        migrations.AddField(
            model_name='question',
            name='accepted_answer',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='accepted_for_question', to='answers.answer'),
        ),
    ]

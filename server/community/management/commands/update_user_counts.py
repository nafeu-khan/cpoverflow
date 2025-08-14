from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from community.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Update user profile question and answer counts'

    def handle(self, *args, **options):
        self.stdout.write('Updating user profile counts...')
        
        profiles_updated = 0
        for user in User.objects.all():
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Count questions and answers
            questions_count = user.questions.count()
            answers_count = user.answers.count()
            
            # Update profile
            profile.questions_asked = questions_count
            profile.answers_given = answers_count
            profile.save()
            
            profiles_updated += 1
            self.stdout.write(
                f'Updated {user.username}: {questions_count} questions, {answers_count} answers'
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {profiles_updated} user profiles')
        )

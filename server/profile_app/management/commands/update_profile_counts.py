from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from profile_app.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Update question and answer counts for all user profiles'

    def handle(self, *args, **options):
        self.stdout.write('Updating user profile question and answer counts...')
        
        updated_count = 0
        for user in User.objects.all():
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Count questions and answers
            questions_count = user.questions.count()
            answers_count = user.answers.count()
            
            # Update profile if counts have changed
            if profile.questions_asked != questions_count or profile.answers_given != answers_count:
                profile.questions_asked = questions_count
                profile.answers_given = answers_count
                profile.save()
                updated_count += 1
                self.stdout.write(
                    f'Updated {user.username}: {questions_count} questions, {answers_count} answers'
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} user profiles')
        )

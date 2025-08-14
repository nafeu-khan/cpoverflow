from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from community.models import UserProfile

User = get_user_model()

class Command(BaseCommand):
    help = 'Create UserProfile objects for existing users who do not have one'

    def handle(self, *args, **options):
        users_without_profile = User.objects.filter(profile__isnull=True)
        
        self.stdout.write(f'Found {users_without_profile.count()} users without profiles')
        
        created_count = 0
        for user in users_without_profile:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                created_count += 1
                self.stdout.write(f'Created profile for user: {user.username}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} user profiles')
        )
        
        # Show total counts
        total_users = User.objects.count()
        total_profiles = UserProfile.objects.count()
        self.stdout.write(f'Total users: {total_users}')
        self.stdout.write(f'Total profiles: {total_profiles}')

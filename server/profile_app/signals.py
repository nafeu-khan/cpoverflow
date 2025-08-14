from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when User is created"""
    if created:
        UserProfile.objects.create(user=instance)
    else:
        # Ensure profile exists for existing users
        UserProfile.objects.get_or_create(user=instance)


# Update question and answer counts when questions/answers are created/deleted
@receiver(post_save, sender='questions.Question')
def update_questions_asked_count(sender, instance, created, **kwargs):
    """Update questions_asked count when a question is created"""
    if created:
        profile, created = UserProfile.objects.get_or_create(user=instance.author)
        profile.questions_asked = instance.author.questions.count()
        profile.save()


@receiver(post_delete, sender='questions.Question')
def decrease_questions_asked_count(sender, instance, **kwargs):
    """Update questions_asked count when a question is deleted"""
    try:
        profile = UserProfile.objects.get(user=instance.author)
        profile.questions_asked = instance.author.questions.count()
        profile.save()
    except UserProfile.DoesNotExist:
        pass


@receiver(post_save, sender='answers.Answer')
def update_answers_given_count(sender, instance, created, **kwargs):
    """Update answers_given count when an answer is created"""
    if created:
        profile, created = UserProfile.objects.get_or_create(user=instance.author)
        profile.answers_given = instance.author.answers.count()
        profile.save()


@receiver(post_delete, sender='answers.Answer')
def decrease_answers_given_count(sender, instance, **kwargs):
    """Update answers_given count when an answer is deleted"""
    try:
        profile = UserProfile.objects.get(user=instance.author)
        profile.answers_given = instance.author.answers.count()
        profile.save()
    except UserProfile.DoesNotExist:
        pass

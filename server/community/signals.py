from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserActivity

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_activity(sender, instance, created, **kwargs):
    """Create UserActivity when a new user is created"""
    if created:
        UserActivity.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_activity(sender, instance, **kwargs):
    """Save UserActivity when user is saved"""
    if hasattr(instance, 'activity'):
        instance.activity.save()
    else:
        UserActivity.objects.create(user=instance)
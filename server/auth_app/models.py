from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from common.models import SoftDeleteModel,TimestampedModel

class CustomUser(AbstractUser,SoftDeleteModel,TimestampedModel):
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True, default='profile_pictures/default/default.png')
    address= models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    portfolio_website = models.URLField(max_length=200, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    # groups = models.ManyToManyField(
    #     'auth.Group',
    #     related_name='customuser_set',
    #     blank=True,
    #     help_text='The groups this user belongs to.',
    #     verbose_name='groups',
    # )
    # user_permissions = models.ManyToManyField(
    #     'auth.Permission',
    #     related_name='customuser_set',
    #     blank=True,
    #     help_text='Specific permissions for this user.',
    #     verbose_name='user permissions',
    # )
    
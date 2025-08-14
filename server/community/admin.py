from django.contrib import admin
from .models import UserFollow


@admin.register(UserFollow)
class UserFollowAdmin(admin.ModelAdmin):
    list_display = ['follower', 'following', 'created_at']
    list_filter = ['created_at']
    search_fields = ['follower__username', 'following__username']

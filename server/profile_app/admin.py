from django.contrib import admin
from .models import UserProfile, Badge, UserBadge, Activity, Reputation


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'reputation', 'questions_asked', 'answers_given', 'best_answers', 'created_at']
    list_filter = ['created_at', 'reputation']
    search_fields = ['user__username', 'user__email', 'bio', 'location']
    readonly_fields = ['reputation', 'questions_asked', 'answers_given', 'best_answers']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'badge_type', 'created_at']
    list_filter = ['badge_type', 'created_at']
    search_fields = ['name', 'description']


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at']
    list_filter = ['badge__badge_type', 'earned_at']
    search_fields = ['user__username', 'badge__name']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'description', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'description']


@admin.register(Reputation)
class ReputationAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'points', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__username']

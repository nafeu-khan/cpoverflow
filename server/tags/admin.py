from django.contrib import admin
from .models import Tag, TagFollow


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'question_count', 'followers_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['question_count', 'followers_count']


@admin.register(TagFollow)
class TagFollowAdmin(admin.ModelAdmin):
    list_display = ['user', 'tag', 'created_at']
    list_filter = ['created_at']

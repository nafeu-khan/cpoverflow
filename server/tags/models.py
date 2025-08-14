from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color code
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    question_count = models.PositiveIntegerField(default=0)
    followers_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['question_count']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class TagFollow(models.Model):
    """Users following specific tags"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followed_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'tag']
    
    def save(self, *args, **kwargs):
        if not self.pk:  # New follow
            self.tag.followers_count += 1
            self.tag.save()
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        self.tag.followers_count -= 1
        self.tag.save()
        super().delete(*args, **kwargs)

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class UserActivity(models.Model):
    """Track user activity and online status"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='activity')
    is_online = models.BooleanField(default=False)
    last_activity = models.DateTimeField(default=timezone.now)
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Activity"
        verbose_name_plural = "User Activities"
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_status}"
    
    def update_last_activity(self):
        """Update user's last activity timestamp"""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def is_recently_active(self, minutes=5):
        """Check if user was active in the last X minutes"""
        if not self.last_activity:
            return False
        time_threshold = timezone.now() - timezone.timedelta(minutes=minutes)
        return self.last_activity >= time_threshold
    
    @property
    def activity_status(self):
        """Get user's activity status"""
        if self.is_online:
            return 'online'
        elif self.is_recently_active(5):
            return 'active'
        elif self.is_recently_active(60):
            return 'away'
        else:
            return 'offline'
    
    @property
    def is_active_now(self):
        """Check if user is currently active (online or recently active)"""
        return self.is_online or self.is_recently_active(5)


class UserFollow(models.Model):
    """Users following other users"""
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['follower', 'following']
    
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

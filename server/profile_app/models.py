from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

User = get_user_model()


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    github_username = models.CharField(max_length=100, blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_username = models.CharField(max_length=100, blank=True)
    reputation = models.PositiveIntegerField(default=0)
    questions_asked = models.PositiveIntegerField(default=0)
    answers_given = models.PositiveIntegerField(default=0)
    best_answers = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @property
    def total_votes_received(self):
        question_votes = sum(q.vote_score for q in self.user.questions.all())
        answer_votes = sum(a.vote_score for a in self.user.answers.all())
        return question_votes + answer_votes


class Badge(models.Model):
    BADGE_TYPES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    badge_type = models.CharField(max_length=10, choices=BADGE_TYPES)
    icon = models.CharField(max_length=100, blank=True)  # Icon class or URL
    criteria = models.JSONField(help_text="Criteria for earning this badge")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['badge_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.badge_type})"


class UserBadge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awarded_to')
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge']
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} earned {self.badge.name}"


class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('question_asked', 'Asked a Question'),
        ('answer_given', 'Gave an Answer'),
        ('answer_accepted', 'Answer Accepted'),
        ('upvote_received', 'Received Upvote'),
        ('badge_earned', 'Earned Badge'),
        ('user_followed', 'Followed User'),
        ('tag_followed', 'Followed Tag'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    content_object_id = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Activities"
    
    def __str__(self):
        return f"{self.user.username} - {self.get_activity_type_display()}"


class Reputation(models.Model):
    """Track reputation changes"""
    ACTION_TYPES = [
        ('question_upvote', 'Question Upvoted (+5)'),
        ('question_downvote', 'Question Downvoted (-2)'),
        ('answer_upvote', 'Answer Upvoted (+10)'),
        ('answer_downvote', 'Answer Downvoted (-2)'),
        ('answer_accepted', 'Answer Accepted (+15)'),
        ('best_answer', 'Best Answer (+25)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reputation_changes')
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    points = models.IntegerField()  # Can be positive or negative
    content_object_id = models.PositiveIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update user's total reputation
        profile, created = UserProfile.objects.get_or_create(user=self.user)
        total_rep = self.user.reputation_changes.aggregate(
            total=models.Sum('points')
        )['total'] or 0
        profile.reputation = max(0, total_rep)  # Reputation can't be negative
        profile.save()

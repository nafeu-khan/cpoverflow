from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('question_answered', 'Your question was answered'),
        ('answer_accepted', 'Your answer was accepted'),
        ('question_upvoted', 'Your question was upvoted'),
        ('answer_upvoted', 'Your answer was upvoted'),
        ('question_commented', 'Someone commented on your question'),
        ('answer_commented', 'Someone commented on your answer'),
        ('user_followed', 'Someone followed you'),
        ('tag_question', 'New question in followed tag'),
        ('badge_earned', 'You earned a new badge'),
        ('job_applied', 'Someone applied to your job posting'),
        ('job_status_changed', 'Your job application status changed'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=25, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    content_object_id = models.PositiveIntegerField(blank=True, null=True)
    action_url = models.URLField(blank=True)  # URL to redirect when notification is clicked
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class NotificationSettings(models.Model):
    """User preferences for notifications"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Email notifications
    email_question_answered = models.BooleanField(default=True)
    email_answer_accepted = models.BooleanField(default=True)
    email_question_upvoted = models.BooleanField(default=False)
    email_answer_upvoted = models.BooleanField(default=True)
    email_user_followed = models.BooleanField(default=True)
    email_tag_questions = models.BooleanField(default=False)
    email_job_applications = models.BooleanField(default=True)
    
    # In-app notifications
    app_question_answered = models.BooleanField(default=True)
    app_answer_accepted = models.BooleanField(default=True)
    app_question_upvoted = models.BooleanField(default=True)
    app_answer_upvoted = models.BooleanField(default=True)
    app_user_followed = models.BooleanField(default=True)
    app_tag_questions = models.BooleanField(default=True)
    app_job_applications = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Notification settings for {self.user.username}"

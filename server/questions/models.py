from django.db import models
from django.contrib.auth import get_user_model
from tags.models import Tag

User = get_user_model()


class Question(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions')
    tags = models.ManyToManyField(Tag, related_name='questions', blank=True)
    views = models.PositiveIntegerField(default=0)
    upvotes = models.PositiveIntegerField(default=0)
    downvotes = models.PositiveIntegerField(default=0)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_answered = models.BooleanField(default=False)
    accepted_answer = models.OneToOneField(
        'answers.Answer', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='accepted_for_question'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['views']),
            models.Index(fields=['upvotes']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def vote_score(self):
        return self.upvotes - self.downvotes
    
    @property
    def answer_count(self):
        return self.answers.count()


class QuestionView(models.Model):
    """Track unique views for questions"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='question_views')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['question', 'user', 'ip_address']


class QuestionVote(models.Model):
    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]
    
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['question', 'user']
    
    def save(self, *args, **kwargs):
        # Update question vote counts
        if self.pk:  # If updating existing vote
            old_vote = QuestionVote.objects.get(pk=self.pk)
            if old_vote.vote_type == 'up':
                self.question.upvotes -= 1
            else:
                self.question.downvotes -= 1
        
        super().save(*args, **kwargs)
        
        if self.vote_type == 'up':
            self.question.upvotes += 1
        else:
            self.question.downvotes += 1
        self.question.save()


class QuestionBookmark(models.Model):
    """User bookmarks for questions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarked_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'question']

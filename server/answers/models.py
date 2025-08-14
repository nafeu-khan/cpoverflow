from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Answer(models.Model):
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE, related_name='answers')
    upvotes = models.PositiveIntegerField(default=0)
    downvotes = models.PositiveIntegerField(default=0)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_accepted', '-upvotes', '-created_at']
        indexes = [
            models.Index(fields=['question', 'is_accepted']),
            models.Index(fields=['upvotes']),
        ]
    
    def __str__(self):
        return f"Answer by {self.author.username} for {self.question.title}"
    
    @property
    def vote_score(self):
        return self.upvotes - self.downvotes
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update question answered status
        if self.is_accepted:
            self.question.is_answered = True
            self.question.accepted_answer = self
            self.question.save()


class AnswerVote(models.Model):
    VOTE_CHOICES = [
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    ]
    
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['answer', 'user']
    
    def save(self, *args, **kwargs):
        # Update answer vote counts
        if self.pk:  # If updating existing vote
            old_vote = AnswerVote.objects.get(pk=self.pk)
            if old_vote.vote_type == 'up':
                self.answer.upvotes -= 1
            else:
                self.answer.downvotes -= 1
        
        super().save(*args, **kwargs)
        
        if self.vote_type == 'up':
            self.answer.upvotes += 1
        else:
            self.answer.downvotes += 1
        self.answer.save()


class Comment(models.Model):
    """Comments on answers"""
    content = models.TextField(max_length=500)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username}"

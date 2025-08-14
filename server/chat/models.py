from django.db import models
from django.contrib.auth import get_user_model
from community.models import UserFollow

User = get_user_model()


class ChatRoom(models.Model):
    """Chat room between two users"""
    participants = models.ManyToManyField(User, related_name='chat_rooms')
    name = models.CharField(max_length=255, blank=True)
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.name:
            return self.name
        participants = list(self.participants.all())
        if len(participants) == 2:
            return f"Chat between {participants[0].username} and {participants[1].username}"
        return f"Chat Room {self.id}"
    
    @property
    def room_name(self):
        """Generate unique room name for WebSocket"""
        if self.is_group:
            return f"group_{self.id}"
        else:
            participant_ids = sorted([p.id for p in self.participants.all()])
            return f"chat_{participant_ids[0]}_{participant_ids[1]}"
    
    def can_user_access(self, user):
        """Check if user can access this chat room"""
        if user in self.participants.all():
            return True
        return False
    
    def get_other_participant(self, user):
        """Get the other participant in a 1-on-1 chat"""
        if self.is_group:
            return None
        participants = self.participants.exclude(id=user.id)
        return participants.first() if participants.exists() else None


class Message(models.Model):
    """Chat message"""
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ]
    
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField()
    file_url = models.URLField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"


class MessageReadStatus(models.Model):
    """Track message read status for each user"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_status')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} read {self.message.id}"


class FollowRequest(models.Model):
    """Follow request system for mutual following"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_follow_requests')
    requested = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_follow_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['requester', 'requested']
    
    def __str__(self):
        return f"{self.requester.username} -> {self.requested.username} ({self.status})"
    
    def accept(self):
        """Accept the follow request and create mutual follow relationship"""
        self.status = 'accepted'
        self.save()
        
        # Create or get UserFollow relationships (mutual following)
        UserFollow.objects.get_or_create(
            follower=self.requester,
            following=self.requested
        )
        UserFollow.objects.get_or_create(
            follower=self.requested,
            following=self.requester
        )
        
        # Create a chat room for them
        chat_room = ChatRoom.objects.create()
        chat_room.participants.add(self.requester, self.requested)
        
        return chat_room
    
    def reject(self):
        """Reject the follow request"""
        self.status = 'rejected'
        self.save()

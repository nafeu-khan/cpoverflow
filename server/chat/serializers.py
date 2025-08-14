from rest_framework import serializers
from .models import ChatRoom, Message, FollowRequest, MessageReadStatus
from auth_app.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'message_type', 'content', 'file_url',
            'is_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sender', 'created_at', 'updated_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    other_participant_status = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'is_group', 'participants', 'last_message',
            'unread_count', 'other_participant', 'other_participant_status',
            'created_at', 'updated_at'
        ]
    
    def get_last_message(self, obj):
        last_message = obj.messages.last()
        if last_message:
            return MessageSerializer(last_message).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.exclude(
                read_status__user=request.user
            ).count()
        return 0
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and not obj.is_group:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return UserSerializer(other_user).data
        return None
    
    def get_other_participant_status(self, obj):
        """Get the activity status of the other participant"""
        request = self.context.get('request')
        if request and request.user.is_authenticated and not obj.is_group:
            other_user = obj.get_other_participant(request.user)
            if other_user and hasattr(other_user, 'activity'):
                return other_user.activity.activity_status
        return 'offline'


class ChatRoomDetailSerializer(ChatRoomSerializer):
    messages = serializers.SerializerMethodField()
    
    class Meta(ChatRoomSerializer.Meta):
        fields = ChatRoomSerializer.Meta.fields + ['messages']
    
    def get_messages(self, obj):
        messages = obj.messages.all()[:50]  # Get last 50 messages
        return MessageSerializer(messages, many=True).data


class FollowRequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    requested = UserSerializer(read_only=True)
    
    class Meta:
        model = FollowRequest
        fields = [
            'id', 'requester', 'requested', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['requester', 'created_at', 'updated_at']

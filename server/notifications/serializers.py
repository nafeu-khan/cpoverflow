from rest_framework import serializers
from .models import Notification, NotificationSettings
from auth_app.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'notification_type', 'title', 'message',
            'is_read', 'action_url', 'created_at', 'read_at'
        ]
        read_only_fields = ['created_at', 'read_at']


class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            'email_question_answered', 'email_answer_accepted', 'email_question_upvoted',
            'email_answer_upvoted', 'email_user_followed', 'email_tag_questions',
            'email_job_applications', 'app_question_answered', 'app_answer_accepted',
            'app_question_upvoted', 'app_answer_upvoted', 'app_user_followed',
            'app_tag_questions', 'app_job_applications'
        ]

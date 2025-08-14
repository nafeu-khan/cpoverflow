from rest_framework import serializers
from django.db import models
from .models import UserProfile, Badge, UserBadge, Activity, Reputation
from auth_app.serializers import UserSerializer


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'badge_type', 'icon']


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    
    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    badges = UserBadgeSerializer(source='user.badges', many=True, read_only=True)
    total_votes_received = serializers.ReadOnlyField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'bio', 'location', 'website', 'avatar', 'github_username',
            'linkedin_url', 'twitter_username', 'reputation', 'questions_asked',
            'answers_given', 'best_answers', 'total_votes_received', 'badges',
            'followers_count', 'following_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'reputation', 'questions_asked', 'answers_given', 'best_answers'
        ]
    
    def get_followers_count(self, obj):
        return obj.user.followers.count()
    
    def get_following_count(self, obj):
        return obj.user.following.count()


class ActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Activity
        fields = [
            'id', 'user', 'activity_type', 'description', 
            'content_object_id', 'created_at'
        ]


class ReputationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Reputation
        fields = ['id', 'user', 'action', 'points', 'content_object_id', 'created_at']

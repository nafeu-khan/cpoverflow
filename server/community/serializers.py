from rest_framework import serializers
from django.db import models
from .models import UserFollow, UserActivity
from auth_app.serializers import UserSerializer
from profile_app.models import UserProfile
from profile_app.serializers import UserProfileSerializer


class UserActivitySerializer(serializers.ModelSerializer):
    """Serializer for user activity and online status"""
    activity_status = serializers.ReadOnlyField()
    is_active_now = serializers.ReadOnlyField()
    
    class Meta:
        model = UserActivity
        fields = [
            'is_online', 'last_activity', 'last_seen', 'activity_status',
            'is_active_now', 'updated_at'
        ]
        read_only_fields = ['last_activity', 'last_seen', 'updated_at']


class UserFollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = UserFollow
        fields = ['id', 'follower', 'following', 'created_at']


class CommunityUserProfileSerializer(UserProfileSerializer):
    """Extended UserProfile serializer for community features"""
    is_following = serializers.SerializerMethodField()
    is_mutual_follow = serializers.SerializerMethodField()
    
    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + ['is_following', 'is_mutual_follow']
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj.user:
            return UserFollow.objects.filter(
                follower=request.user, 
                following=obj.user
            ).exists()
        return False
    
    def get_is_mutual_follow(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj.user:
            # Check if both users follow each other
            user_follows_them = UserFollow.objects.filter(
                follower=request.user, 
                following=obj.user
            ).exists()
            they_follow_user = UserFollow.objects.filter(
                follower=obj.user, 
                following=request.user
            ).exists()
            return user_follows_them and they_follow_user
        return False


class LeaderboardSerializer(serializers.ModelSerializer):
    """Serializer for leaderboard display"""
    user = UserSerializer(read_only=True)
    badge_counts = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = [
            'user', 'reputation', 'questions_asked', 'answers_given', 
            'best_answers', 'badge_counts'
        ]
    
    def get_badge_counts(self, obj):
        badges = obj.user.badges.values('badge__badge_type').annotate(
            count=models.Count('badge__badge_type')
        )
        return {badge['badge__badge_type']: badge['count'] for badge in badges}

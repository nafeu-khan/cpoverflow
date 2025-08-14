from rest_framework import serializers
from django.db.models import Count
from .models import Tag, TagFollow


class TagSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = [
            'id', 'name', 'slug', 'description', 'color',
            'question_count', 'followers_count', 'is_following',
            'created_at'
        ]
        read_only_fields = ['slug', 'question_count', 'followers_count']
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return TagFollow.objects.filter(tag=obj, user=request.user).exists()
        return False
    
    def get_question_count(self, obj):
        """Get actual question count from database"""
        if hasattr(obj, 'question_count'):
            return obj.question_count
        return obj.questions.count()


class TagListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tag lists"""
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'description', 'color', 'question_count']
    
    def get_question_count(self, obj):
        """Get actual question count from database"""
        return obj.questions.count()


class TagFollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagFollow
        fields = ['id', 'created_at']
        read_only_fields = ['id', 'created_at']

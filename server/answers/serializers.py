from rest_framework import serializers
from .models import Answer, AnswerVote, Comment
from auth_app.serializers import UserSerializer


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at', 'updated_at']
        read_only_fields = ['author']


class QuestionBasicSerializer(serializers.Serializer):
    """Basic question info for answer responses"""
    id = serializers.IntegerField()
    title = serializers.CharField()


class AnswerSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    vote_score = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = [
            'id', 'content', 'author', 'upvotes', 'downvotes', 'vote_score',
            'is_accepted', 'comments', 'user_vote', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'upvotes', 'downvotes', 'is_accepted']
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = AnswerVote.objects.filter(answer=obj, user=request.user).first()
            return vote.vote_type if vote else None
        return None


class UserAnswerSerializer(serializers.ModelSerializer):
    """Serializer for user answers that includes question info"""
    author = UserSerializer(read_only=True)
    question = QuestionBasicSerializer(read_only=True)
    vote_score = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = [
            'id', 'content', 'author', 'question', 'vote_score',
            'is_accepted', 'user_vote', 'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'is_accepted']
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = AnswerVote.objects.filter(answer=obj, user=request.user).first()
            return vote.vote_type if vote else None
        return None


class AnswerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for answer lists"""
    author = serializers.CharField(source='author.username', read_only=True)
    vote_score = serializers.ReadOnlyField()
    
    class Meta:
        model = Answer
        fields = [
            'id', 'content', 'author', 'vote_score', 'is_accepted', 'created_at'
        ]


class AnswerVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerVote
        fields = ['vote_type']
    
    def create(self, validated_data):
        answer = self.context['answer']
        user = self.context['user']
        
        # Check if user already voted
        existing_vote = AnswerVote.objects.filter(answer=answer, user=user).first()
        
        if existing_vote:
            if existing_vote.vote_type == validated_data['vote_type']:
                # Same vote type - remove vote
                existing_vote.delete()
                return None
            else:
                # Different vote type - update vote
                existing_vote.vote_type = validated_data['vote_type']
                existing_vote.save()
                return existing_vote
        else:
            # New vote
            return AnswerVote.objects.create(
                answer=answer,
                user=user,
                **validated_data
            )

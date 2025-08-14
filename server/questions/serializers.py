from rest_framework import serializers
from .models import Question, QuestionVote, QuestionBookmark, QuestionView
from tags.serializers import TagSerializer
from auth_app.serializers import UserSerializer


class QuestionSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    vote_score = serializers.ReadOnlyField()
    answer_count = serializers.ReadOnlyField()
    user_vote = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = [
            'id', 'title', 'content', 'author', 'tags', 'tag_names',
            'views', 'upvotes', 'downvotes', 'vote_score', 'priority',
            'is_answered', 'answer_count', 'user_vote', 'is_bookmarked',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'views', 'upvotes', 'downvotes', 'is_answered']
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = QuestionVote.objects.filter(question=obj, user=request.user).first()
            return vote.vote_type if vote else None
        return None
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestionBookmark.objects.filter(question=obj, user=request.user).exists()
        return False
    
    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        question = Question.objects.create(**validated_data)
        
        # Handle tags
        if tag_names:
            from tags.models import Tag
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.lower())
                question.tags.add(tag)
                if created:
                    tag.question_count = 1
                else:
                    tag.question_count += 1
                tag.save()
        
        return question


class QuestionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for question lists"""
    author = UserSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    vote_score = serializers.ReadOnlyField()
    answer_count = serializers.ReadOnlyField()
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = [
            'id', 'title', 'author', 'tags', 'views', 'vote_score',
            'answer_count', 'is_answered', 'is_bookmarked', 'created_at'
        ]
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestionBookmark.objects.filter(question=obj, user=request.user).exists()
        return False


class QuestionVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionVote
        fields = ['vote_type']
    
    def create(self, validated_data):
        question = self.context['question']
        user = self.context['user']
        
        # Check if user already voted
        existing_vote = QuestionVote.objects.filter(question=question, user=user).first()
        
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
            return QuestionVote.objects.create(
                question=question,
                user=user,
                **validated_data
            )


class QuestionBookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionBookmark
        fields = ['id', 'created_at']
        read_only_fields = ['id', 'created_at']

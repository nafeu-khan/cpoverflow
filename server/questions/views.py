from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, F, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Question, QuestionVote, QuestionBookmark, QuestionView
from .serializers import (
    QuestionSerializer, QuestionListSerializer, QuestionVoteSerializer,
    QuestionBookmarkSerializer
)


class QuestionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class QuestionListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        """List questions with filtering and pagination"""
        queryset = Question.objects.select_related('author').prefetch_related('tags')
        
        # Search functionality
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(tags__name__icontains=search)
            ).distinct()
        
        # Filter by tags (support both tag IDs and tag names)
        tags = request.query_params.get('tags', '')
        if tags:
            tag_list = tags.split(',')
            # Check if the tags are numeric (IDs) or text (names)
            try:
                # Try to convert to integers (tag IDs)
                tag_ids = [int(tag.strip()) for tag in tag_list]
                queryset = queryset.filter(tags__id__in=tag_ids).distinct()
            except ValueError:
                # If not numeric, treat as tag names
                queryset = queryset.filter(tags__name__in=tag_list).distinct()
        
        # Filter by answered status
        answered = request.query_params.get('answered', '')
        if answered.lower() == 'true':
            queryset = queryset.filter(is_answered=True)
        elif answered.lower() == 'false':
            queryset = queryset.filter(is_answered=False)
        
        # Sorting
        sort_by = request.query_params.get('sort', 'newest')
        if sort_by == 'oldest':
            queryset = queryset.order_by('created_at')
        elif sort_by == 'votes':
            queryset = queryset.annotate(
                vote_score=F('upvotes') - F('downvotes')
            ).order_by('-vote_score', '-created_at')
        elif sort_by == 'views':
            queryset = queryset.order_by('-views', '-created_at')
        elif sort_by == 'answers':
            queryset = queryset.annotate(
                answer_count=Count('answers')
            ).order_by('-answer_count', '-created_at')
        else:  # newest
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        paginator = QuestionPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        serializer = QuestionListSerializer(page, many=True, context={'request': request})
        paginated_response = paginator.get_paginated_response(serializer.data)
        
        # Convert to expected frontend format
        return Response({
            'success': True,
            'questions': paginated_response.data['results'],
            'isNext': paginated_response.data['next'] is not None,
            'count': paginated_response.data['count']
        })
    
    def post(self, request):
        """Create a new question"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = QuestionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_object(self, pk):
        """Get question object and track view"""
        try:
            obj = Question.objects.select_related('author').prefetch_related('tags', 'answers__author').get(pk=pk)
            
            # Track view if user is authenticated or by IP
            user = self.request.user if self.request.user.is_authenticated else None
            ip_address = self.get_client_ip()
            
            view_obj, created = QuestionView.objects.get_or_create(
                question=obj,
                user=user,
                ip_address=ip_address
            )
            
            if created:
                obj.views = F('views') + 1
                obj.save(update_fields=['views'])
                obj.refresh_from_db()
            
            return obj
        except Question.DoesNotExist:
            return None
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip
    
    def get(self, request, pk):
        """Retrieve question details"""
        question = self.get_object(pk)
        if not question:
            return Response(
                {'success': False, 'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = QuestionSerializer(question, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def put(self, request, pk):
        """Update question"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        question = self.get_object(pk)
        if not question:
            return Response(
                {'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if question.author != request.user:
            return Response(
                {'error': 'You can only edit your own questions.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = QuestionSerializer(question, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete question"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        question = self.get_object(pk)
        if not question:
            return Response(
                {'error': 'Question not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if question.author != request.user:
            return Response(
                {'error': 'You can only delete your own questions.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        question.delete()
        return Response(
            {'message': 'Question deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def vote_question(request, question_id):
    """Vote on a question"""
    question = get_object_or_404(Question, id=question_id)
    
    # Users cannot vote on their own questions
    if question.author == request.user:
        return Response(
            {'error': 'You cannot vote on your own question.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = QuestionVoteSerializer(
        data=request.data,
        context={'question': question, 'user': request.user}
    )
    
    if serializer.is_valid():
        vote = serializer.save()
        question.refresh_from_db()
        
        return Response({
            'message': 'Vote recorded successfully.',
            'upvotes': question.upvotes,
            'downvotes': question.downvotes,
            'vote_score': question.vote_score,
            'user_vote': vote.vote_type if vote else None
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def bookmark_question(request, question_id):
    """Bookmark or unbookmark a question"""
    question = get_object_or_404(Question, id=question_id)
    
    if request.method == 'POST':
        bookmark, created = QuestionBookmark.objects.get_or_create(
            user=request.user,
            question=question
        )
        
        if created:
            return Response({'message': 'Question bookmarked successfully.'})
        else:
            return Response(
                {'message': 'Question already bookmarked.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    elif request.method == 'DELETE':
        try:
            bookmark = QuestionBookmark.objects.get(
                user=request.user,
                question=question
            )
            bookmark.delete()
            return Response({'message': 'Bookmark removed successfully.'})
        except QuestionBookmark.DoesNotExist:
            return Response(
                {'error': 'Question is not bookmarked.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_questions(request):
    """Get current user's questions"""
    questions = Question.objects.filter(author=request.user).order_by('-created_at')
    
    paginator = QuestionPagination()
    page = paginator.paginate_queryset(questions, request)
    
    serializer = QuestionListSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def user_bookmarks(request):
    """Get current user's bookmarked questions"""
    bookmarks = QuestionBookmark.objects.filter(user=request.user).select_related('question__author')
    questions = [bookmark.question for bookmark in bookmarks]
    
    paginator = QuestionPagination()
    page = paginator.paginate_queryset(questions, request)
    
    serializer = QuestionListSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
def trending_questions(request):
    """Get trending/hot questions based on recent activity, votes, and views"""
    from datetime import datetime, timedelta
    from django.utils import timezone
    
    # First try to get recent questions (last 30 days for more inclusive results)
    last_month = timezone.now() - timedelta(days=30)
    
    questions = Question.objects.filter(
        created_at__gte=last_month
    ).select_related('author').prefetch_related('tags').annotate(
        answer_count=Count('answers'),
        vote_score=F('upvotes') - F('downvotes'),
        engagement_score=(F('upvotes') - F('downvotes')) + F('views') + (Count('answers') * 2)
    ).order_by('-engagement_score', '-vote_score', '-views')[:5]
    
    # If not enough recent questions, get top questions of all time
    if questions.count() < 5:
        questions = Question.objects.select_related('author').prefetch_related('tags').annotate(
            answer_count=Count('answers'),
            vote_score=F('upvotes') - F('downvotes'),
            engagement_score=(F('upvotes') - F('downvotes')) + F('views') + (Count('answers') * 2)
        ).order_by('-engagement_score', '-vote_score', '-views', '-created_at')[:5]
    
    # If still not enough, just get the most recent questions
    if questions.count() < 5:
        questions = Question.objects.select_related('author').prefetch_related('tags').order_by('-created_at')[:5]
    
    serializer = QuestionListSerializer(questions, many=True, context={'request': request})
    return Response({
        'results': serializer.data
    })


class UserQuestionsView(APIView):
    """Get all questions by a specific user"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get the user by username (since user_id is actually username)
        try:
            user = User.objects.get(username=user_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get user's questions
        questions = Question.objects.filter(author=user).select_related('author').prefetch_related('tags')
        
        # Apply pagination
        paginator = QuestionPagination()
        page = paginator.paginate_queryset(questions, request)
        
        if page is not None:
            serializer = QuestionListSerializer(page, many=True, context={'request': request})
            return Response({
                "success": True,
                "questions": serializer.data,
                "isNext": paginator.get_next_link() is not None
            }, status=status.HTTP_200_OK)
        
        serializer = QuestionListSerializer(questions, many=True, context={'request': request})
        return Response({
            "success": True,
            "questions": serializer.data,
            "isNext": False
        }, status=status.HTTP_200_OK)

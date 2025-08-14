from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from questions.models import Question
from .models import Answer, AnswerVote, Comment
from .serializers import AnswerSerializer, AnswerVoteSerializer, CommentSerializer


class AnswerPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class AnswerListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request, question_id):
        """List answers for a question"""
        answers = Answer.objects.filter(question_id=question_id).select_related('author')
        
        # Apply sorting if specified
        sort_by = request.query_params.get('sort_by', 'newest')
        if sort_by == 'oldest':
            answers = answers.order_by('created_at')
        elif sort_by == 'votes':
            answers = answers.order_by('-upvotes', '-created_at')
        else:  # newest
            answers = answers.order_by('-created_at')
        
        # Apply pagination
        paginator = AnswerPagination()
        page = paginator.paginate_queryset(answers, request)
        
        if page is not None:
            serializer = AnswerSerializer(page, many=True, context={'request': request})
            return Response({
                'success': True,
                'answers': serializer.data,
                'isNext': paginator.get_next_link() is not None
            })
        
        serializer = AnswerSerializer(answers, many=True, context={'request': request})
        return Response({
            'success': True,
            'answers': serializer.data,
            'isNext': False
        })
    
    def post(self, request, question_id):
        """Create new answer"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        question = get_object_or_404(Question, id=question_id)
        serializer = AnswerSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user, question=question)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnswerDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_object(self, pk):
        try:
            return Answer.objects.select_related('author').get(pk=pk)
        except Answer.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Retrieve answer details"""
        answer = self.get_object(pk)
        if not answer:
            return Response(
                {'error': 'Answer not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnswerSerializer(answer, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, pk):
        """Update answer"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        answer = self.get_object(pk)
        if not answer:
            return Response(
                {'error': 'Answer not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if answer.author != request.user:
            return Response(
                {'error': 'You can only edit your own answers.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AnswerSerializer(answer, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete answer"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        answer = self.get_object(pk)
        if not answer:
            return Response(
                {'error': 'Answer not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if answer.author != request.user:
            return Response(
                {'error': 'You can only delete your own answers.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        answer.delete()
        return Response(
            {'message': 'Answer deleted successfully'}, 
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def vote_answer(request, answer_id):
    """Vote on an answer"""
    answer = get_object_or_404(Answer, id=answer_id)
    
    if answer.author == request.user:
        return Response(
            {'error': 'You cannot vote on your own answer.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = AnswerVoteSerializer(
        data=request.data,
        context={'answer': answer, 'user': request.user}
    )
    
    if serializer.is_valid():
        vote = serializer.save()
        answer.refresh_from_db()
        
        return Response({
            'message': 'Vote recorded successfully.',
            'upvotes': answer.upvotes,
            'downvotes': answer.downvotes,
            'vote_score': answer.vote_score,
            'user_vote': vote.vote_type if vote else None
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_answer(request, answer_id):
    """Accept an answer as the best answer"""
    answer = get_object_or_404(Answer, id=answer_id)
    
    # Only question author can accept answers
    if answer.question.author != request.user:
        return Response(
            {'error': 'Only the question author can accept answers.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Remove previously accepted answer
    if answer.question.accepted_answer:
        old_answer = answer.question.accepted_answer
        old_answer.is_accepted = False
        old_answer.save()
    
    # Accept this answer
    answer.is_accepted = True
    answer.save()
    
    return Response({'message': 'Answer accepted successfully.'})


class CommentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request, answer_id):
        """List comments for an answer"""
        comments = Comment.objects.filter(answer_id=answer_id).select_related('author')
        serializer = CommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request, answer_id):
        """Create new comment"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        answer = get_object_or_404(Answer, id=answer_id)
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user, answer=answer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAnswersView(APIView):
    """Get all answers by a specific user"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, user_id):
        from django.contrib.auth import get_user_model
        from rest_framework.pagination import PageNumberPagination
        User = get_user_model()
        
        # Get the user by username (since user_id is actually username)
        try:
            user = User.objects.get(username=user_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get user's answers
        answers = Answer.objects.filter(author=user).select_related('author', 'question')
        
        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(answers, request)
        
        if page is not None:
            from .serializers import UserAnswerSerializer
            serializer = UserAnswerSerializer(page, many=True, context={'request': request})
            return Response({
                "success": True,
                "answers": serializer.data,
                "isNext": paginator.get_next_link() is not None
            }, status=status.HTTP_200_OK)
        
        serializer = AnswerSerializer(answers, many=True, context={'request': request})
        return Response({
            "success": True,
            "answers": serializer.data,
            "isNext": False
        }, status=status.HTTP_200_OK)

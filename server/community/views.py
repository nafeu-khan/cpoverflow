from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import UserFollow, UserActivity
from .serializers import (
    CommunityUserProfileSerializer, UserFollowSerializer, LeaderboardSerializer,
    UserActivitySerializer
)
from auth_app.serializers import UserSerializer
from profile_app.models import UserProfile

User = get_user_model()


class UserProfileListView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        """List user profiles with filtering and sorting for community discovery"""
        from rest_framework.pagination import PageNumberPagination
        
        queryset = UserProfile.objects.select_related('user').prefetch_related('user__badges__badge')
        
        # Exclude current user from community list if authenticated
        if request.user.is_authenticated:
            queryset = queryset.exclude(user=request.user)
        queryset = queryset.exclude(user__is_superuser=True, user__is_staff=True)
        
        # Search functionality
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search) |
                Q(bio__icontains=search) |
                Q(location__icontains=search)
            )
        
        # Filter by location
        location = request.query_params.get('location', '')
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Sorting
        sort_by = request.query_params.get('sort', 'reputation')
        if sort_by == 'new_users':
            queryset = queryset.order_by('-user__date_joined')
        elif sort_by == 'old_users':
            queryset = queryset.order_by('user__date_joined')
        elif sort_by == 'top_contributors':
            queryset = queryset.order_by('-reputation', '-questions_asked', '-answers_given')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-user__date_joined')
        elif sort_by == 'questions':
            queryset = queryset.order_by('-questions_asked')
        elif sort_by == 'answers':
            queryset = queryset.order_by('-answers_given')
        else:  # reputation (default)
            queryset = queryset.order_by('-reputation')
        
        # Apply pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = CommunityUserProfileSerializer(page, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'count': paginator.page.paginator.count
            })
        
        serializer = CommunityUserProfileSerializer(queryset, many=True, context={'request': request})
        return Response({'results': serializer.data})


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request, user_id):
    """Follow or unfollow a user"""
    user_to_follow = get_object_or_404(User, id=user_id)
    
    if user_to_follow == request.user:
        return Response(
            {'error': 'You cannot follow yourself.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == 'POST':
        follow, created = UserFollow.objects.get_or_create(
            follower=request.user,
            following=user_to_follow
        )
        
        if created:
            return Response({'message': 'User followed successfully.'})
        else:
            return Response(
                {'message': 'User already followed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    elif request.method == 'DELETE':
        try:
            follow = UserFollow.objects.get(
                follower=request.user,
                following=user_to_follow
            )
            follow.delete()
            return Response({'message': 'User unfollowed successfully.'})
        except UserFollow.DoesNotExist:
            return Response(
                {'error': 'User is not followed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_followers(request, user_id):
    """Get followers of a user"""
    user = get_object_or_404(User, id=user_id)
    follows = UserFollow.objects.filter(following=user).select_related('follower')
    serializer = UserFollowSerializer(follows, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_following(request, user_id):
    """Get users that a user is following"""
    user = get_object_or_404(User, id=user_id)
    follows = UserFollow.objects.filter(follower=user).select_related('following')
    serializer = UserFollowSerializer(follows, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def leaderboard(request):
    """Get leaderboard of top users"""
    profiles = UserProfile.objects.select_related('user').prefetch_related('user__badges__badge')
    
    # Filter by time period
    period = request.query_params.get('period', 'all_time')
    
    # Sort by different criteria
    sort_by = request.query_params.get('sort', 'reputation')
    if sort_by == 'questions':
        profiles = profiles.order_by('-questions_asked')[:50]
    elif sort_by == 'answers':
        profiles = profiles.order_by('-answers_given')[:50]
    elif sort_by == 'best_answers':
        profiles = profiles.order_by('-best_answers')[:50]
    else:  # reputation
        profiles = profiles.order_by('-reputation')[:50]
    
    serializer = LeaderboardSerializer(profiles, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_activity_status(request, user_id):
    """Get user's activity status"""
    user = get_object_or_404(User, id=user_id)
    activity, created = UserActivity.objects.get_or_create(user=user)
    
    serializer = UserActivitySerializer(activity)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def online_users(request):
    """Get list of currently online users that the current user follows"""
    # Get users that the current user follows
    following_users = UserFollow.objects.filter(
        follower=request.user
    ).values_list('following', flat=True)
    
    # Get online activities for followed users
    online_activities = UserActivity.objects.filter(
        user__in=following_users,
        is_online=True
    ).select_related('user')
    
    # Serialize the data
    data = []
    for activity in online_activities:
        data.append({
            'user': UserSerializer(activity.user).data,
            'activity': UserActivitySerializer(activity).data
        })
    
    return Response(data)

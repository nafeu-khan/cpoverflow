from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import UserProfile, Badge, UserBadge, Activity
from .serializers import (
    UserProfileSerializer, BadgeSerializer, UserBadgeSerializer,
    ActivitySerializer
)

User = get_user_model()


class UserProfileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_object(self, username):
        try:
            return UserProfile.objects.select_related('user').get(user__username=username)
        except UserProfile.DoesNotExist:
            return None
    
    def get(self, request, username):
        """Retrieve user profile"""
        profile = self.get_object(username)
        if not profile:
            return Response(
                {'error': 'User profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, username):
        """Update user profile"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profile = self.get_object(username)
        if not profile:
            return Response(
                {'error': 'User profile not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if profile.user != request.user:
            return Response(
                {'error': 'You can only edit your own profile.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserProfileSerializer(profile, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BadgeListView(APIView):
    def get(self, request):
        """List all badges"""
        badges = Badge.objects.all()
        serializer = BadgeSerializer(badges, many=True, context={'request': request})
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_activities(request, user_id=None):
    """Get activities for a user (current user if no user_id provided)"""
    if user_id:
        user = get_object_or_404(User, id=user_id)
    else:
        user = request.user
    
    activities = Activity.objects.filter(user=user).order_by('-created_at')[:50]
    serializer = ActivitySerializer(activities, many=True, context={'request': request})
    return Response(serializer.data)

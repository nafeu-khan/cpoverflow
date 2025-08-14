from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from .models import Tag, TagFollow
from .serializers import TagSerializer, TagListSerializer, TagFollowSerializer


class TagDetailView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request, pk):
        """Get tag details by ID"""
        try:
            tag = get_object_or_404(Tag, pk=pk)
            serializer = TagSerializer(tag, context={'request': request})
            return Response(serializer.data)
        except Tag.DoesNotExist:
            return Response(
                {'error': 'Tag not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class TagListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get(self, request):
        """List tags with filtering and sorting"""
        queryset = Tag.objects.all()
        
        # Search functionality
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Sorting
        sort_by = request.query_params.get('sort', 'popular')
        if sort_by == 'name':
            queryset = queryset.order_by('name')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-created_at')
        else:  # popular
            # Order by question count first, then by name for consistent results
            queryset = queryset.order_by('-question_count', 'name')
        
        # Apply limit for popular tags in sidebar
        limit = request.query_params.get('limit')
        if limit:
            try:
                limit = int(limit)
                # Don't apply limit if we have fewer tags than the limit
                if queryset.count() > limit:
                    queryset = queryset[:limit]
            except ValueError:
                pass
        
        serializer = TagListSerializer(queryset, many=True, context={'request': request})
        return Response({
            'tags': serializer.data,
            'isNext': False  # Implement pagination later if needed
        })
    
    def post(self, request):
        """Create new tag"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = TagSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def follow_tag(request, tag_id):
    """Follow or unfollow a tag"""
    tag = get_object_or_404(Tag, id=tag_id)
    
    if request.method == 'POST':
        follow, created = TagFollow.objects.get_or_create(
            user=request.user,
            tag=tag
        )
        
        if created:
            return Response({'message': 'Tag followed successfully.'})
        else:
            return Response(
                {'message': 'Tag already followed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    elif request.method == 'DELETE':
        try:
            follow = TagFollow.objects.get(user=request.user, tag=tag)
            follow.delete()
            return Response({'message': 'Tag unfollowed successfully.'})
        except TagFollow.DoesNotExist:
            return Response(
                {'error': 'Tag is not followed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_followed_tags(request):
    """Get tags followed by current user"""
    follows = TagFollow.objects.filter(user=request.user).select_related('tag')
    tags = [follow.tag for follow in follows]
    serializer = TagListSerializer(tags, many=True, context={'request': request})
    return Response(serializer.data)

from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notification, NotificationSettings
from .serializers import NotificationSerializer, NotificationSettingsSerializer


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """List user notifications"""
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True, context={'request': request})
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    notification = get_object_or_404(
        Notification, 
        id=notification_id, 
        recipient=request.user
    )
    
    notification.mark_as_read()
    return Response({'message': 'Notification marked as read.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    """Mark all notifications as read for current user"""
    count = Notification.objects.filter(
        recipient=request.user, 
        is_read=False
    ).update(is_read=True)
    
    return Response({'message': f'{count} notifications marked as read.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    """Get count of unread notifications"""
    count = Notification.objects.filter(
        recipient=request.user, 
        is_read=False
    ).count()
    
    return Response({'unread_count': count})


class NotificationSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        settings, created = NotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings
    
    def get(self, request):
        """Get notification settings"""
        settings = self.get_object()
        serializer = NotificationSettingsSerializer(settings, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        """Update notification settings"""
        settings = self.get_object()
        serializer = NotificationSettingsSerializer(settings, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

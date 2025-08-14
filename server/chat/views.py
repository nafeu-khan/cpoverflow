from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import ChatRoom, Message, FollowRequest, MessageReadStatus
from .serializers import (
    ChatRoomSerializer, ChatRoomDetailSerializer, MessageSerializer,
    FollowRequestSerializer
)
from community.models import UserFollow

User = get_user_model()


class ChatRoomListView(generics.ListAPIView):
    """List user's chat rooms"""
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ChatRoom.objects.filter(
            participants=self.request.user
        ).order_by('-updated_at')


class ChatRoomDetailView(generics.RetrieveAPIView):
    """Get chat room details with messages"""
    serializer_class = ChatRoomDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'
    lookup_url_kwarg = 'room_id'
    
    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user)


class CreateChatRoomView(APIView):
    """Create a new chat room with specific users"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        participant_id = request.data.get('participant_id')
        user_ids = request.data.get('user_ids', [])
        is_group = request.data.get('is_group', False)
        room_name = request.data.get('name', '')
        
        # Handle simple participant_id parameter for 1-on-1 chats
        if participant_id:
            user_ids = [participant_id]
            is_group = False
        
        if not user_ids:
            return Response(
                {'error': 'User IDs are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For 1-on-1 chat, check if room already exists
        if not is_group and len(user_ids) == 1:
            other_user_id = user_ids[0]
            try:
                other_user = User.objects.get(id=other_user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if users can chat (user follows the other person)
            user_follows_other = UserFollow.objects.filter(
                follower=request.user, 
                following=other_user
            ).exists()
            
            if not user_follows_other:
                return Response(
                    {'error': 'You can only chat with users you follow'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            existing_room = ChatRoom.objects.filter(
                participants=request.user,
                is_group=False
            ).filter(
                participants=other_user_id
            ).first()
            
            if existing_room:
                serializer = ChatRoomDetailSerializer(
                    existing_room, 
                    context={'request': request}
                )
                return Response(serializer.data)
        
        # Create new room
        room = ChatRoom.objects.create(
            name=room_name,
            is_group=is_group
        )
        
        # Add participants
        room.participants.add(request.user)
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                room.participants.add(user)
            except User.DoesNotExist:
                continue
        
        serializer = ChatRoomDetailSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListCreateView(generics.ListCreateAPIView):
    """List and create messages in a chat room"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
            return room.messages.all().order_by('created_at')
        except ChatRoom.DoesNotExist:
            return Message.objects.none()
    
    def perform_create(self, serializer):
        room_id = self.kwargs['room_id']
        try:
            room = ChatRoom.objects.get(id=room_id, participants=self.request.user)
            serializer.save(sender=self.request.user, room=room)
        except ChatRoom.DoesNotExist:
            raise ValidationError("Chat room not found or access denied")


class FollowRequestListView(generics.ListAPIView):
    """List received follow requests"""
    serializer_class = FollowRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FollowRequest.objects.filter(
            requested=self.request.user,
            status='pending'
        ).order_by('-created_at')


class SendFollowRequestView(APIView):
    """Send a follow request to another user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'User ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            requested_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if requested_user == request.user:
            return Response(
                {'error': 'Cannot send follow request to yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already following
        if UserFollow.objects.filter(
            follower=request.user,
            following=requested_user
        ).exists():
            return Response(
                {'error': 'Already following this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if request already exists
        existing_request = FollowRequest.objects.filter(
            requester=request.user,
            requested=requested_user
        ).first()
        
        if existing_request:
            if existing_request.status == 'pending':
                return Response(
                    {'error': 'Follow request already sent'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            elif existing_request.status == 'rejected':
                # Allow resending after rejection
                existing_request.status = 'pending'
                existing_request.save()
                serializer = FollowRequestSerializer(existing_request)
                return Response(serializer.data)
        else:
            # Create new request
            follow_request = FollowRequest.objects.create(
                requester=request.user,
                requested=requested_user
            )
            serializer = FollowRequestSerializer(follow_request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class AcceptFollowRequestView(APIView):
    """Accept a follow request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            follow_request = FollowRequest.objects.get(
                id=request_id,
                requested=request.user,
                status='pending'
            )
        except FollowRequest.DoesNotExist:
            return Response(
                {'error': 'Follow request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        chat_room = follow_request.accept()
        
        return Response({
            'message': 'Follow request accepted',
            'chat_room_id': chat_room.id
        })


class RejectFollowRequestView(APIView):
    """Reject a follow request"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        try:
            follow_request = FollowRequest.objects.get(
                id=request_id,
                requested=request.user,
                status='pending'
            )
        except FollowRequest.DoesNotExist:
            return Response(
                {'error': 'Follow request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        follow_request.reject()
        
        return Response({'message': 'Follow request rejected'})


class MarkChatRoomReadView(APIView):
    """Mark all messages in a chat room as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, room_id):
        try:
            chat_room = ChatRoom.objects.get(
                id=room_id,
                participants=request.user
            )
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Chat room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mark all unread messages as read
        unread_messages = chat_room.messages.exclude(sender=request.user)
        for message in unread_messages:
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=request.user
            )
        
        return Response({'message': 'Messages marked as read'})


class MarkMessageReadView(APIView):
    """Mark a message as read"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, message_id):
        try:
            message = Message.objects.get(id=message_id)
            # Check if user has access to this message
            if not message.room.can_user_access(request.user):
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Mark as read
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=request.user
            )
            
            return Response({'message': 'Message marked as read'})
            
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )

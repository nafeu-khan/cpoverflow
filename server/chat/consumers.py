import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, Message, MessageReadStatus

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        print(f"WebSocket connection attempt for room {self.room_id}")
        print(f"User: {self.scope['user']}")
        print(f"Is authenticated: {self.scope['user'].is_authenticated}")
        
        # Check if user is authenticated and has access to the room
        if not self.scope['user'].is_authenticated:
            print("User not authenticated, closing connection")
            await self.close()
            return
        
        room_access = await self.check_room_access()
        if not room_access:
            print("User does not have room access, closing connection")
            await self.close()
            return
        
        print("User authenticated and has room access, accepting connection")
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        print(f"WebSocket connection accepted for user {self.scope['user'].username}")
        
        # Send user joined message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user': self.scope['user'].username,
                'user_id': self.scope['user'].id
            }
        )
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Send user left message
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left',
                    'user': self.scope['user'].username,
                    'user_id': self.scope['user'].id
                }
            )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        
        if message_type == 'message':
            message = text_data_json['message']
            
            # Save message to database
            saved_message = await self.save_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_message
                }
            )
        
        elif message_type == 'typing':
            is_typing = text_data_json.get('is_typing', False)
            
            # Send typing status to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_status',
                    'user': self.scope['user'].username,
                    'user_id': self.scope['user'].id,
                    'is_typing': is_typing
                }
            )
        
        elif message_type == 'read_message':
            message_id = text_data_json.get('message_id')
            if message_id:
                await self.mark_message_read(message_id)
    
    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))
    
    async def typing_status(self, event):
        # Don't send typing status to the sender
        if event['user_id'] != self.scope['user'].id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user': event['user'],
                'user_id': event['user_id'],
                'is_typing': event['is_typing']
            }))
    
    async def user_joined(self, event):
        # Don't send join message to the user who joined
        if event['user_id'] != self.scope['user'].id:
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user': event['user'],
                'user_id': event['user_id']
            }))
    
    async def user_left(self, event):
        # Don't send leave message to the user who left
        if event['user_id'] != self.scope['user'].id:
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'user': event['user'],
                'user_id': event['user_id']
            }))
    
    @database_sync_to_async
    def check_room_access(self):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            return room.can_user_access(self.scope['user'])
        except ChatRoom.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, message_content):
        try:
            room = ChatRoom.objects.get(id=self.room_id)
            message = Message.objects.create(
                room=room,
                sender=self.scope['user'],
                content=message_content,
                message_type='text'
            )
            
            # Update room's updated_at timestamp
            room.save()
            
            # Construct full profile picture URL
            profile_picture_url = None
            if message.sender.profile_picture:
                if message.sender.profile_picture.url.startswith('http'):
                    profile_picture_url = message.sender.profile_picture.url
                else:
                    # Add domain for relative URLs
                    from django.conf import settings
                    profile_picture_url = f"http://127.0.0.1:8000{message.sender.profile_picture.url}"
            
            return {
                'id': message.id,
                'content': message.content,
                'sender': {
                    'id': message.sender.id,
                    'username': message.sender.username,
                    'profile_picture': profile_picture_url
                },
                'message_type': message.message_type,
                'created_at': message.created_at.isoformat(),
                'is_read': False
            }
        except ChatRoom.DoesNotExist:
            return None
    
    @database_sync_to_async
    def mark_message_read(self, message_id):
        try:
            message = Message.objects.get(id=message_id)
            if message.room.can_user_access(self.scope['user']):
                MessageReadStatus.objects.get_or_create(
                    message=message,
                    user=self.scope['user']
                )
                return True
        except Message.DoesNotExist:
            pass
        return False

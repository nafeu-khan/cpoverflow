from django.urls import path
from . import views

urlpatterns = [
    # Chat rooms
    path('rooms/', views.ChatRoomListView.as_view(), name='chat-room-list'),
    path('rooms/<int:room_id>/', views.ChatRoomDetailView.as_view(), name='chat-room-detail'),
    path('rooms/<int:room_id>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('rooms/<int:room_id>/mark_read/', views.MarkChatRoomReadView.as_view(), name='mark-chat-room-read'),
    path('rooms/create/', views.CreateChatRoomView.as_view(), name='create-chat-room'),
    
    # Follow requests
    path('follow-requests/', views.FollowRequestListView.as_view(), name='follow-request-list'),
    path('follow-requests/send/', views.SendFollowRequestView.as_view(), name='send-follow-request'),
    path('follow-requests/<int:request_id>/accept/', views.AcceptFollowRequestView.as_view(), name='accept-follow-request'),
    path('follow-requests/<int:request_id>/reject/', views.RejectFollowRequestView.as_view(), name='reject-follow-request'),
    
    # Messages
    path('messages/<int:message_id>/read/', views.MarkMessageReadView.as_view(), name='mark-message-read'),
]

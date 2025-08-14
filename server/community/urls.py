from django.urls import path
from . import views

urlpatterns = [
    # Community discovery
    path('users/', views.UserProfileListView.as_view(), name='community-list'),
    
    # User following system
    path('users/<int:user_id>/follow/', views.follow_user, name='follow-user'),
    path('users/<int:user_id>/followers/', views.user_followers, name='user-followers'),
    path('users/<int:user_id>/following/', views.user_following, name='user-following'),
    
    # User activity and online status
    path('users/<int:user_id>/activity/', views.user_activity_status, name='user-activity-status'),
    path('online-users/', views.online_users, name='online-users'),
    
    # Leaderboard
    path('leaderboard/', views.leaderboard, name='leaderboard'),
]

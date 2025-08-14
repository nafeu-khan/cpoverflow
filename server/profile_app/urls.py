from django.urls import path
from . import views

urlpatterns = [
    path('<str:username>/', views.UserProfileDetailView.as_view(), name='user-profile-detail'),
    path('badges/', views.BadgeListView.as_view(), name='badge-list'),
    path('activities/', views.user_activities, name='user-activities'),
    path('activities/<int:user_id>/', views.user_activities, name='user-activities-detail'),
]

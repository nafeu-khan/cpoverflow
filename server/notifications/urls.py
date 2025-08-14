from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    path('mark-all-read/', views.mark_all_read, name='mark-all-read'),
    path('unread-count/', views.unread_count, name='unread-count'),
    path('settings/', views.NotificationSettingsView.as_view(), name='notification-settings'),
]

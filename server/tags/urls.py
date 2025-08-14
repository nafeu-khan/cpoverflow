from django.urls import path
from . import views

urlpatterns = [
    path('', views.TagListCreateView.as_view(), name='tag-list-create'),
    path('<int:pk>/', views.TagDetailView.as_view(), name='tag-detail'),
    path('<int:tag_id>/follow/', views.follow_tag, name='follow-tag'),
    path('followed/', views.user_followed_tags, name='user-followed-tags'),
]

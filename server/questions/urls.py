from django.urls import path
from . import views

urlpatterns = [
    path('', views.QuestionListCreateView.as_view(), name='question-list-create'),
    path('<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    path('<int:question_id>/vote/', views.vote_question, name='vote-question'),
    path('<int:question_id>/bookmark/', views.bookmark_question, name='bookmark-question'),
    path('my-questions/', views.user_questions, name='user-questions'),
    path('my-bookmarks/', views.user_bookmarks, name='user-bookmarks'),
    path('trending/', views.trending_questions, name='trending-questions'),
]

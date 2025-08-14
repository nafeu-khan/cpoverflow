from django.urls import path
from . import views

urlpatterns = [
    path('question/<int:question_id>/', views.AnswerListCreateView.as_view(), name='answer-list-create'),
    path('<int:pk>/', views.AnswerDetailView.as_view(), name='answer-detail'),
    path('<int:answer_id>/vote/', views.vote_answer, name='vote-answer'),
    path('<int:answer_id>/accept/', views.accept_answer, name='accept-answer'),
    path('<int:answer_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
]

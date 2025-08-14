from django.urls import path
from . import views

urlpatterns = [
    path('', views.JobListCreateView.as_view(), name='job-list-create'),
    path('<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('<int:job_id>/apply/', views.apply_job, name='apply-job'),
    path('<int:job_id>/bookmark/', views.bookmark_job, name='bookmark-job'),
    path('companies/', views.CompanyListCreateView.as_view(), name='company-list-create'),
    path('categories/', views.JobCategoryListView.as_view(), name='job-category-list'),
    path('my-applications/', views.user_job_applications, name='user-job-applications'),
    path('my-jobs/', views.user_posted_jobs, name='user-posted-jobs'),
]

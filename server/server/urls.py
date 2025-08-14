"""
URL configuration for server project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from questions.views import UserQuestionsView
from answers.views import UserAnswersView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_app.urls')),
    path('api/questions/', include('questions.urls')),
    path('api/answers/', include('answers.urls')),
    path('api/tags/', include('tags.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/profiles/', include('profile_app.urls')),
    path('api/community/', include('community.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/chat/', include('chat.urls')),
    # User-specific endpoints
    path('api/users/<str:user_id>/questions/', UserQuestionsView.as_view(), name='user-questions'),
    path('api/users/<str:user_id>/answers/', UserAnswersView.as_view(), name='user-answers'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

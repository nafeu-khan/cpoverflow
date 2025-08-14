from django.urls import path
from .views import *

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.urls import path

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/<int:user_id>/', UserByIdView.as_view(), name='user_by_id'),
    path('profile/<str:username>/', UserByUsernameView.as_view(), name='user_by_username'),
    path('update-status/', UpdateOnlineStatusView.as_view(), name='update_online_status'),
    path('forgot-password/', PasswordResetRequestView.as_view(), name='forgot_password'),
    path('reset-password/', PasswordResetConfirmView.as_view(), name='reset_password'),
    path('verify_token/', verify_token, name='verify_token'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

]

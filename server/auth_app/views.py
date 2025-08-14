from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from rest_framework.permissions import AllowAny,IsAuthenticated
import os
import jwt
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework.decorators import api_view
from .utils import encrypt_uuid, decrypt_uuid
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print(request.data)
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                user.is_verified = True  # Auto-verify for now
                user.save()
                
                # Uncomment below to enable email verification
                # token = PasswordResetTokenGenerator().make_token(user)
                # verification_link = f"{request.data.get('base_url', 'http://localhost:3000/verify-email')}?uid={encrypt_uuid(str(user.id))}&token={token}"
                # send_mail(
                #     'Verify Your Email',
                #     f'Click the link to verify your email: {verification_link}',
                #     settings.EMAIL_HOST_USER,
                #     [user.email],
                #     fail_silently=False,
                # )
                
                return Response({
                    "success": True,
                    "message": "User registration completed successfully."
                }, status=status.HTTP_201_CREATED)
            
            # Handle validation errors
            error_message = "Registration failed. "
            if 'username' in serializer.errors:
                error_message += "Username already exists or is invalid. "
            if 'email' in serializer.errors:
                error_message += "Email already exists or is invalid. "
            if 'password' in serializer.errors:
                error_message += "Password is invalid. "
                
            return Response({
                "success": False,
                "error": error_message.strip()
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(str(e))
            return Response({
                "success": False,
                "error": "An error occurred during registration. This username or email may already exist."
            }, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            uid = request.data.get('uid')
            token = request.data.get('token')
            user_id = decrypt_uuid(uid)
            user = get_object_or_404(User, id=user_id)

            if PasswordResetTokenGenerator().check_token(user, token):
                user.is_verified = True
                user.save()
                return Response({
                    "success": True,
                    "message": "Email verified successfully."
                }, status=status.HTTP_200_OK)
            
            return Response({
                "success": False,
                "error": "Invalid token or user."
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: 
            return Response({
                "success": False,
                "error": f"Error while verifying email: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user'] 

            if not user.is_verified:
                return Response({
                    "success": False,
                    "error": "Email not verified. Please check your email and verify your account."
                }, status=status.HTTP_400_BAD_REQUEST)

            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'user_id': user.id
            }, status=status.HTTP_200_OK)

        # Handle login errors
        error_message = "Invalid credentials."
        if serializer.errors:
            if 'non_field_errors' in serializer.errors:
                error_message = serializer.errors['non_field_errors'][0]
            else:
                error_message = "Invalid username or password."
                
        return Response({
            'success': False,
            'error': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, context={'request': request})
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        user = request.user
        
        # Validate profile picture if provided
        profile_picture = request.FILES.get('profile_picture')
        if profile_picture:
            # Validate file size (max 5MB)
            if profile_picture.size > 5 * 1024 * 1024:
                return Response({
                    "success": False,
                    "error": "File size must be less than 5MB."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file type
            if not profile_picture.content_type.startswith('image/'):
                return Response({
                    "success": False,
                    "error": "File must be an image."
                }, status=status.HTTP_400_BAD_REQUEST)

        print(request.data)
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        old_profile_picture = (
            user.profile_picture.path
            if user.profile_picture and os.path.exists(user.profile_picture.path)
            else None
        )

        user.delete()

        if old_profile_picture:
            try:
                os.remove(old_profile_picture)
            except Exception as e:
                return Response({
                    "success": False,
                    "error": f"Failed to delete profile picture: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "success": True,
            "message": "User deleted successfully."
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            email = request.data.get('email')
            base_url = request.data.get('base_url', 'http://localhost:3000/reset-password')
            
            if not email:
                return Response({
                    'success': False,
                    'error': 'Email is required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'User with this email does not exist.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = PasswordResetTokenGenerator().make_token(user)
            reset_link = f"{base_url}?uid={encrypt_uuid(str(user.id))}&token={token}"
            
            send_mail(
                'Password Reset - CPoverflow',
                f'Click the link to reset your password: {reset_link}',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'success': True,
                'message': 'Password reset email sent. Please check your email and follow the instructions.'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error sending password reset email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def verify_token(request):
    token = request.data.get('token', None)
    if not token:
        return Response({
            'success': False,
            'detail': 'Token is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return Response({
            'success': True,
            'detail': 'Token is valid',
            'payload': payload
        }, status=status.HTTP_200_OK)
    except jwt.ExpiredSignatureError:
        return Response({
            'success': False,
            'detail': 'Token has expired'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({
            'success': False,
            'detail': 'Invalid token'
        }, status=status.HTTP_401_UNAUTHORIZED)

    
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:    
            token = request.data.get('token')
            new_password = request.data.get('new_password')
            uuid = request.data.get('uid')
            
            if not all([token, new_password, uuid]):
                return Response({
                    'success': False,
                    'error': 'Token, new password, and uid are required.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_id = decrypt_uuid(uuid)
            user = get_object_or_404(User, id=user_id)
            
            if PasswordResetTokenGenerator().check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({
                    'success': True,
                    'message': 'Password reset successfully.'
                })
            
            return Response({
                'success': False,
                'error': 'Invalid token or user.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Error resetting password: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response({
                'success': False,
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({
                "success": True,
                "message": 'Logout successful.'
            }, status=status.HTTP_200_OK)

        except TokenError as e:
            return Response({
                'success': False,
                'error': f'Token error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'error': f'Unexpected error during logout: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserByIdView(APIView):
    permission_classes = [AllowAny]  # Allow anyone to view user profiles

    def get(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)
            serializer = UserProfileSerializer(user)
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)


class UpdateOnlineStatusView(APIView):
    """Update user's online/offline status"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from community.models import UserActivity
        
        is_online = request.data.get('is_online', False)
        activity, created = UserActivity.objects.get_or_create(user=request.user)
        activity.is_online = is_online
        activity.update_last_activity()
        activity.save()
        
        return Response({
            'success': True,
            'message': 'Status updated',
            'activity_status': activity.activity_status,
            'is_online': activity.is_online
        }, status=status.HTTP_200_OK)


class UserByUsernameView(APIView):
    permission_classes = [AllowAny]  # Allow anyone to view user profiles

    def get(self, request, username):
        try:
            user = get_object_or_404(User, username=username)
            serializer = UserProfileSerializer(user)
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)
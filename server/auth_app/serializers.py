from urllib import request
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
import os

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for foreign key relationships"""
    activity_status = serializers.SerializerMethodField()
    is_recently_active = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'profile_picture', 'date_joined',
            'activity_status', 'is_recently_active', 'is_online', 'last_activity'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            import time
            # Add timestamp to prevent caching issues
            timestamp = int(time.time())
            base_url = obj.profile_picture.url
            separator = '&' if '?' in base_url else '?'
            cache_buster = f"{base_url}{separator}t={timestamp}"
            
            if request:
                return request.build_absolute_uri(cache_buster)
            return cache_buster
        return None
    
    def get_activity_status(self, obj):
        if hasattr(obj, 'activity'):
            return obj.activity.activity_status
        return 'offline'
    
    def get_is_recently_active(self, obj):
        if hasattr(obj, 'activity'):
            return obj.activity.is_recently_active()
        return False
    
    def get_is_online(self, obj):
        if hasattr(obj, 'activity'):
            return obj.activity.is_online
        return False
    
    def get_last_activity(self, obj):
        if hasattr(obj, 'activity'):
            return obj.activity.last_activity
        return None


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'profile_picture', 'address', 'phone_number', 'bio']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            profile_picture=validated_data.get('profile_picture'),
            address=validated_data.get('address'),
            phone_number=validated_data.get('phone_number'),
            bio=validated_data.get('bio'),
        )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Both username and password are required.")

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        if not getattr(user, 'is_verified', True):  # If `is_verified` exists, check it.
            raise serializers.ValidationError("Email not verified.")

        data['user'] = user
        return data




class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()  

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'username', 'email',
            'profile_picture', 'address', 'phone_number',
            'portfolio_website', 'bio', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'email', 'created_at']

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture:
            import time
            # Add timestamp to prevent caching issues
            timestamp = int(time.time())
            base_url = obj.profile_picture.url
            separator = '&' if '?' in base_url else '?'
            cache_buster = f"{base_url}{separator}t={timestamp}"
            
            if request:
                return request.build_absolute_uri(cache_buster)
            return cache_buster
        
        # Return None for no profile picture - let frontend handle default avatar
        return None

    def update(self, instance, validated_data):
        request = self.context.get('request')
        profile_picture = request.FILES.get('profile_picture') if request else None

        if (
            profile_picture and 
            instance.profile_picture and 
            hasattr(instance.profile_picture, 'path') and
            os.path.exists(instance.profile_picture.path) and
            'default.png' not in instance.profile_picture.name
        ):
            try:
                os.remove(instance.profile_picture.path)
            except Exception as e:
                raise serializers.ValidationError({
                    "error": f"Failed to delete old profile picture: {str(e)}"
                })

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if profile_picture:
            instance.profile_picture = profile_picture

        instance.save()
        return instance

      
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")
        return user


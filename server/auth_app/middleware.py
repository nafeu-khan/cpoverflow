from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin


class UserActivityMiddleware(MiddlewareMixin):
    """Middleware to update user's last activity timestamp"""
    
    def process_request(self, request):
        if request.user.is_authenticated:
            # Update last activity for authenticated users through UserActivity model
            from community.models import UserActivity
            activity, created = UserActivity.objects.get_or_create(user=request.user)
            activity.update_last_activity()
        return None

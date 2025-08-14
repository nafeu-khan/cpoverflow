"""
Custom JWT Authentication Middleware for WebSocket connections
"""
import jwt
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from django.conf import settings
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


@database_sync_to_async
def get_user_from_jwt(token):
    try:
        # Use rest_framework_simplejwt to decode and validate the token
        access_token = AccessToken(token)
        user_id = access_token.get('user_id')
        
        if user_id:
            user = User.objects.get(id=user_id)
            print(f"JWT middleware: Authenticated user {user.username} (ID: {user.id})")
            return user
    except (InvalidToken, TokenError, User.DoesNotExist) as e:
        print(f"JWT middleware: Authentication failed - {str(e)}")
        pass
    except Exception as e:
        print(f"JWT middleware: Unexpected error - {str(e)}")
        pass
    
    print("JWT middleware: Returning anonymous user")
    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that authenticates users for WebSocket connections using JWT tokens.
    The token can be passed as a query parameter: ?token=your_jwt_token
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        print(f"JWT middleware: Processing WebSocket connection")
        print(f"JWT middleware: Query string: {query_string}")
        print(f"JWT middleware: Token present: {bool(token)}")
        
        if token:
            # Authenticate user with JWT token
            scope['user'] = await get_user_from_jwt(token)
        else:
            # No token provided, set anonymous user
            print("JWT middleware: No token provided")
            scope['user'] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Convenience function to create the JWT auth middleware stack
    """
    return JWTAuthMiddleware(inner)

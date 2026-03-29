import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


ACCESS_TOKEN_LIFETIME = timedelta(hours=1)
REFRESH_TOKEN_LIFETIME = timedelta(days=30)


def generate_access_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + ACCESS_TOKEN_LIFETIME,
        'iat': datetime.now(timezone.utc),
        'type': 'access',
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def generate_refresh_token(user):
    payload = {
        'user_id': user.id,
        'exp': datetime.now(timezone.utc) + REFRESH_TOKEN_LIFETIME,
        'iat': datetime.now(timezone.utc),
        'type': 'refresh',
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed('Token sudah kedaluwarsa')
    except jwt.InvalidTokenError:
        raise AuthenticationFailed('Token tidak valid')


class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        payload = decode_token(token)

        if payload.get('type') != 'access':
            raise AuthenticationFailed('Token type tidak valid')

        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User tidak ditemukan')

        return (user, token)

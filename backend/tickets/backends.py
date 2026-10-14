# backend/tickets/backends.py
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from .models import Usuario

class CustomUserBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        email = username # Asumiendo que usas el correo como identificador de acceso
        try:
            user = Usuario.objects.get(email=email)
            if check_password(password, user.password):
                return user
        except Usuario.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return Usuario.objects.get(pk=user_id)
        except Usuario.DoesNotExist:
            return None
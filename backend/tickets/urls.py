from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('observaciones/', views.observaciones_view, name='gestion_observaciones'),
]
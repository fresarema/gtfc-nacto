from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('observaciones/', views.observaciones_view, name='gestion_observaciones'),
    path('tickets/convertir/', views.convertir_observacion_a_ticket, name='convertir_ticket'),
    path('tickets/supervisor/', views.bandeja_supervisor, name='bandeja_supervisor'),
    path('tickets/supervisor/<int:id_ticket>/responder/', views.responder_ticket_supervisor, name='responder_ticket'),
    path('tickets/auditar/<int:id_ticket>/', views.auditar_ticket_municipal, name='auditar_ticket'),
    path('usuarios/registrar/', views.registrar_usuario, name='registrar_usuario'),
]
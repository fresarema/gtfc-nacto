from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('observaciones/', views.observaciones_view, name='gestion_observaciones'),
    path('tickets/convertir/', views.convertir_observacion_a_ticket, name='convertir_ticket'),
    path('tickets/supervisor/', views.bandeja_supervisor, name='bandeja_supervisor'),
    path('tickets/supervisor/<int:id_ticket>/responder/', views.responder_ticket_supervisor, name='responder_ticket'),
    path('tickets/<int:id_ticket>/subsanar/', views.subsanar_ticket_supervisor, name='subsanar_ticket'),
    path('tickets/auditar/<int:id_ticket>/', views.auditar_ticket_municipal, name='auditar_ticket'),
    path('usuarios/registrar/', views.registrar_usuario, name='registrar_usuario'),
    path('tickets/<int:id_ticket>/', views.detalle_ticket_view, name='detalle_ticket'),
    path('empresas/crear/', views.crear_empresa, name='crear_empresa'),
    path('tickets/consulta/<str:codigo>/', views.consulta_externa_ticket, name='consulta_externa_ticket'),
    path('empresas/', views.listar_empresas, name='listar_empresas'),
    
]
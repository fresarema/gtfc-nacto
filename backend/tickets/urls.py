from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('observaciones/', views.observaciones_view, name='gestion_observaciones'),
    path('tickets/convertir/', views.convertir_observacion_a_ticket, name='convertir_ticket'),
    path('tickets/supervisor/', views.bandeja_supervisor, name='bandeja_supervisor'),
    path('tickets/supervisor/<int:id_ticket>/responder/', views.responder_ticket_supervisor, name='responder_ticket'),
    path('tickets/alertas-vencimiento/', views.alertas_tickets_por_vencer, name='alertas_vencimiento'),
    path('tickets/auditar/<int:id_ticket>/', views.auditar_ticket_municipal, name='auditar_ticket'),
    path('tickets/consulta/<str:codigo>/', views.consulta_externa_ticket, name='consulta_externa_ticket'),
    path('tickets/<int:id_ticket>/subsanar/', views.subsanar_ticket_supervisor, name='subsanar_ticket'),
    path('tickets/<int:id_ticket>/historial/', views.historial_ticket_view, name='historial_ticket'),
    path('tickets/<int:id_ticket>/enlace-externo/', views.generar_enlace_externo_ticket, name='generar_enlace_externo'),
    path('tickets/<int:id_ticket>/', views.detalle_ticket_view, name='detalle_ticket'),
    path('usuarios/', views.listar_usuarios, name='listar_usuarios'),
    path('usuarios/registrar/', views.registrar_usuario, name='registrar_usuario'),
    path('usuarios/<int:id_usuario>/', views.detalle_editar_usuario, name='detalle_editar_usuario'),
    path('empresas/', views.listar_empresas, name='listar_empresas'),
    path('empresas/crear/', views.crear_empresa, name='crear_empresa'),
    path('empresas/<int:id_empresa>/', views.detalle_editar_empresa, name='detalle_editar_empresa'),
    path('fiscalizador/observaciones/', views.mis_observaciones_fiscalizador_view, name='mis_observaciones_fiscalizador'),
]
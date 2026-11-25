import base64
import uuid
import os
from datetime import timedelta, date, datetime
from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core import signing
from django.contrib.auth.hashers import check_password, make_password
from .models import Usuario, ObservacionTerreno, Fotografia, Empresa, Area, Ticket, HistorialTicket


# --- CONSTANTES DE ROLES Y HELPERS ---

ROLES_ADMIN = ['administrador', 'admin']
ROLES_MUNICIPALES = ['administrador', 'admin', 'usuario municipal', 'municipal']
ROLES_FISCALIZADOR = ['fiscalizador']
ROLES_SUPERVISOR = ['supervisor de empresa externa', 'supervisor']
ROLES_EMPRESA_EXTERNA = [
    'supervisor de empresa externa',
    'supervisor',
    'operario de empresa externa',
    'operario',
]


def obtener_usuario_autenticado(request):
    """Valida el token Bearer y retorna (usuario, None) o (None, Response de error)."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, Response(
            {"error": "Token de autorización faltante o formato incorrecto."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        usuario = Usuario.objects.select_related('id_empresa').get(
            id_usuario=payload.get('id_usuario')
        )
        return usuario, None
    except signing.BadSignature:
        return None, Response(
            {"error": "Token inválido o modificado."},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Usuario.DoesNotExist:
        return None, Response(
            {"error": "Usuario no encontrado."},
            status=status.HTTP_401_UNAUTHORIZED
        )


def calcular_fecha_vencimiento_habil(fecha_inicio, dias_habiles):
    """Suma días hábiles (lunes a viernes) a una fecha inicial."""
    fecha_actual = fecha_inicio
    dias_agregados = 0
    while dias_agregados < dias_habiles:
        fecha_actual += timedelta(days=1)
        if fecha_actual.weekday() < 5:  # 0=Lun ... 4=Vie
            dias_agregados += 1
    return fecha_actual


# --- AUTENTICACIÓN Y PERFIL ---

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    usuario = Usuario.objects.select_related('id_empresa').filter(email=email).first()

    if usuario and check_password(password, usuario.password):
        token = signing.dumps({'id_usuario': usuario.id_usuario})
        nombre_empresa = usuario.id_empresa.razon_social if usuario.id_empresa else None

        data = {
            "token": token,
            "usuario": {
                "id_usuario": usuario.id_usuario,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "email": usuario.email,
                "rol": usuario.rol,
                "id_empresa": usuario.id_empresa.id_empresa if usuario.id_empresa else None,
                "empresa_nombre": nombre_empresa,
                "empresa_asignada": nombre_empresa,
            }
        }
        return Response(data, status=status.HTTP_200_OK)

    return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def user_profile_view(request):
    usuario, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    nombre_empresa = usuario.id_empresa.razon_social if usuario.id_empresa else None
    return Response({
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "email": usuario.email,
        "rol": usuario.rol,
        "id_empresa": usuario.id_empresa.id_empresa if usuario.id_empresa else None,
        "empresa_nombre": nombre_empresa,
        "empresa_asignada": nombre_empresa,
    }, status=status.HTTP_200_OK)


# --- OBSERVACIONES EN TERRENO ---

@api_view(['GET', 'POST'])
def observaciones_view(request):
    usuario, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if request.method == 'GET':
        # Solo Admin y Usuario Municipal acceden a la bandeja general de observaciones
        if usuario.rol.lower() not in ROLES_MUNICIPALES:
            return Response(
                {"error": "No tienes permisos para acceder a las observaciones de terreno."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            observaciones_pendientes = (
                ObservacionTerreno.objects
                .select_related('id_empresa', 'id_fiscalizador')
                .filter(estado__iexact='Pendiente')
                .order_by('-fecha_registro', '-hora_registro')
            )

            data = []
            for obs in observaciones_pendientes:
                fotos = Fotografia.objects.filter(id_observacion=obs.id_observacion)
                rutas_fotos = [foto.url_fotografia for foto in fotos]
                nombre_emp = obs.id_empresa.razon_social if obs.id_empresa else None

                data.append({
                    "id": obs.id_observacion,
                    "id_observacion": obs.id_observacion,
                    "id_empresa": obs.id_empresa.id_empresa if obs.id_empresa else None,
                    "empresa_nombre": nombre_emp,
                    "razon_social": nombre_emp,
                    "fiscalizador": f"{obs.id_fiscalizador.nombre} {obs.id_fiscalizador.apellido}" if obs.id_fiscalizador else None,
                    "fecha_registro": obs.fecha_registro.strftime('%Y-%m-%d') if obs.fecha_registro else None,
                    "hora_registro": obs.hora_registro.strftime('%H:%M:%S') if obs.hora_registro else None,
                    "descripcion": obs.descripcion,
                    "ubicacion_observacion": obs.ubicacion_observacion,
                    "estado": obs.estado,
                    "fotografias": rutas_fotos
                })

            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        if usuario.rol.lower() not in (ROLES_MUNICIPALES + ROLES_FISCALIZADOR):
            return Response(
                {"error": "Tu rol no tiene permisos para registrar observaciones en terreno."},
                status=status.HTTP_403_FORBIDDEN
            )

        descripcion = request.data.get('descripcion')
        ubicacion = request.data.get('ubicacion_observacion')
        foto_b64 = request.data.get('fotografia_b64')
        id_empresa = request.data.get('id_empresa')

        if not descripcion:
            return Response({"error": "La descripción es obligatoria."}, status=status.HTTP_400_BAD_REQUEST)

        empresa = None
        if id_empresa:
            empresa = Empresa.objects.filter(id_empresa=id_empresa).first()
            if not empresa:
                return Response({"error": "La empresa seleccionada no existe."}, status=status.HTTP_404_NOT_FOUND)

        try:
            observacion = ObservacionTerreno.objects.create(
                id_fiscalizador=usuario,
                id_empresa=empresa,
                descripcion=descripcion,
                ubicacion_observacion=ubicacion,
                estado='Pendiente'
            )

            if foto_b64:
                if ';base64,' in foto_b64:
                    formato, imgstr = foto_b64.split(';base64,')
                    ext = formato.split('/')[-1]
                else:
                    imgstr = foto_b64
                    ext = 'jpg'

                data_bytes = base64.b64decode(imgstr)
                nombre_archivo = f"obs_{observacion.id_observacion}_{uuid.uuid4().hex[:8]}.{ext}"

                ruta_carpeta = os.path.join(settings.MEDIA_ROOT, 'fotos')
                os.makedirs(ruta_carpeta, exist_ok=True)

                ruta_fisica = os.path.join(ruta_carpeta, nombre_archivo)
                with open(ruta_fisica, 'wb') as f:
                    f.write(data_bytes)

                ruta_bd = f"{settings.MEDIA_URL}fotos/{nombre_archivo}"
                Fotografia.objects.create(
                    id_observacion=observacion,
                    url_fotografia=ruta_bd
                )

            return Response({
                "mensaje": "Observación registrada exitosamente",
                "id_observacion": observacion.id_observacion,
                "id_empresa": empresa.id_empresa if empresa else None,
                "estado": observacion.estado
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def mis_observaciones_fiscalizador_view(request):
    usuario_actual, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if usuario_actual.rol.lower() not in (ROLES_FISCALIZADOR + ROLES_MUNICIPALES):
        return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)

    try:
        mis_observaciones = (
            ObservacionTerreno.objects
            .select_related('id_empresa')
            .filter(id_fiscalizador=usuario_actual)
            .order_by('-fecha_registro', '-hora_registro')
        )

        data = []
        for obs in mis_observaciones:
            fotos = Fotografia.objects.filter(id_observacion=obs.id_observacion)
            rutas_fotos = [foto.url_fotografia for foto in fotos]
            nombre_emp = obs.id_empresa.razon_social if obs.id_empresa else None

            data.append({
                "id": obs.id_observacion,
                "id_observacion": obs.id_observacion,
                "id_empresa": obs.id_empresa.id_empresa if obs.id_empresa else None,
                "empresa_nombre": nombre_emp,
                "razon_social": nombre_emp,
                "fecha_registro": obs.fecha_registro.strftime('%Y-%m-%d') if obs.fecha_registro else None,
                "hora_registro": obs.hora_registro.strftime('%H:%M:%S') if obs.hora_registro else None,
                "descripcion": obs.descripcion,
                "ubicacion_observacion": obs.ubicacion_observacion,
                "estado": obs.estado,
                "fotografias": rutas_fotos
            })

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- TICKETS ---

@api_view(['POST'])
def convertir_observacion_a_ticket(request):
    creador, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if creador.rol.lower() not in ROLES_MUNICIPALES:
        return Response(
            {"error": f"Tu rol actual ({creador.rol}) no tiene permisos para convertir observaciones a tickets."},
            status=status.HTTP_403_FORBIDDEN
        )

    id_observacion = request.data.get('id_observacion')
    id_empresa = request.data.get('id_empresa')
    id_area = request.data.get('id_area')
    prioridad = request.data.get('prioridad', 'Alta')
    descripcion_ticket = request.data.get('descripcion_ticket')

    try:
        dias_plazo = int(request.data.get('dias_plazo') or 5)
    except (ValueError, TypeError):
        dias_plazo = 5

    try:
        observacion = ObservacionTerreno.objects.select_related('id_empresa').get(id_observacion=id_observacion)

        if observacion.estado == 'Convertido':
            return Response({"error": "Esta observación ya fue convertida a ticket."}, status=status.HTTP_400_BAD_REQUEST)

        # Prioridad: 1) empresa enviada en el request, 2) empresa elegida en terreno, 3) primera registrada
        if id_empresa:
            empresa = Empresa.objects.filter(id_empresa=id_empresa).first()
        elif observacion.id_empresa:
            empresa = observacion.id_empresa
        else:
            empresa = Empresa.objects.first()

        area = Area.objects.filter(id_area=id_area).first() if id_area else Area.objects.first()

        if not empresa or not area:
            return Response(
                {"error": "Debe existir al menos una empresa y área registradas en la BD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        supervisor = (
            Usuario.objects.filter(id_empresa=empresa, rol__iexact='Supervisor de Empresa Externa').first()
            or Usuario.objects.filter(id_empresa=empresa).first()
        )

        codigo_tk = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
        fecha_venc = calcular_fecha_vencimiento_habil(date.today(), dias_plazo)

        ticket = Ticket.objects.create(
            id_observacion=observacion,
            id_empresa=empresa,
            id_area=area,
            supervisor_ticket=supervisor,
            creador_ticket=creador,
            prioridad=prioridad,
            descripcion=descripcion_ticket if descripcion_ticket else observacion.descripcion,
            dias_plazo=dias_plazo,
            fecha_vencimiento=fecha_venc,
            estado='Abierto',
            cod_consulta_externa=codigo_tk,
            fecha_expiracion_consulta=timezone.now() + timedelta(days=3)
        )

        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=creador,
            tipo_accion="Creación de Ticket",
            comentarios=f"Ticket generado formalmente a partir de la observación ID {observacion.id_observacion}."
        )

        observacion.estado = 'Convertido'
        observacion.save()

        return Response({
            "mensaje": "Ticket generado exitosamente",
            "cod_consulta_externa": ticket.cod_consulta_externa,
            "id_ticket": ticket.id_ticket,
            "fecha_vencimiento": ticket.fecha_vencimiento.strftime('%Y-%m-%d'),
            "empresa_nombre": empresa.razon_social
        }, status=status.HTTP_201_CREATED)

    except ObservacionTerreno.DoesNotExist:
        return Response({"error": "La observación indicada no existe."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def bandeja_supervisor(request):
    usuario, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    rol_lower = usuario.rol.lower()
    if rol_lower not in (ROLES_MUNICIPALES + ROLES_SUPERVISOR):
        return Response({"error": "Acceso denegado. Rol incorrecto."}, status=status.HTTP_403_FORBIDDEN)

    try:
        if rol_lower in ROLES_MUNICIPALES:
            tickets = Ticket.objects.select_related('id_empresa', 'id_area').all().order_by('-fecha_creacion', '-id_ticket')
        else:
            # Aislamiento estricto: un supervisor sin empresa asignada NO ve ningún ticket
            if not usuario.id_empresa:
                return Response([], status=status.HTTP_200_OK)
            tickets = (
                Ticket.objects
                .select_related('id_empresa', 'id_area')
                .filter(id_empresa=usuario.id_empresa)
                .order_by('-fecha_creacion', '-id_ticket')
            )

        data = []
        for tk in tickets:
            nombre_empresa = tk.id_empresa.razon_social if tk.id_empresa else None
            data.append({
                "id": tk.id_ticket,
                "id_ticket": tk.id_ticket,
                "cod_consulta_externa": tk.cod_consulta_externa,
                "prioridad": tk.prioridad,
                "descripcion": tk.descripcion,
                "descripcion_ticket": tk.descripcion,
                "fecha_creacion": tk.fecha_creacion.strftime('%Y-%m-%d') if tk.fecha_creacion else None,
                "fecha_vencimiento": tk.fecha_vencimiento.strftime('%Y-%m-%d') if tk.fecha_vencimiento else None,
                "estado": tk.estado,
                "area_asignada": tk.id_area.nombre_area if tk.id_area else "General",
                "id_empresa": tk.id_empresa.id_empresa if tk.id_empresa else None,
                "empresa_nombre": nombre_empresa,
                "empresa_asignada": nombre_empresa,
                "razon_social": nombre_empresa,
            })

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def responder_ticket_supervisor(request, id_ticket):
    supervisor, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if supervisor.rol.lower() not in ROLES_SUPERVISOR:
        return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)

    comentario_respuesta = request.data.get('comentario')
    nuevo_estado = request.data.get('estado', 'En Revisión')

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        # Aislamiento estricto: obliga a tener empresa y que coincida exactamente
        if not supervisor.id_empresa or ticket.id_empresa_id != supervisor.id_empresa_id:
            return Response({"error": "No tienes permiso para modificar este ticket."}, status=status.HTTP_403_FORBIDDEN)

        if ticket.estado.lower() == 'cerrado':
            return Response({"error": "No se puede modificar un ticket cerrado."}, status=status.HTTP_400_BAD_REQUEST)

        ticket.estado = nuevo_estado
        ahora = datetime.now()
        ticket.fecha_respuesta_supervisor = ahora.date()
        ticket.hora_respuesta_supervisor = ahora.time()
        ticket.save()

        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=supervisor,
            tipo_accion="Respuesta de Empresa",
            comentarios=comentario_respuesta or "Respuesta registrada por el supervisor."
        )

        return Response({"mensaje": f"Ticket actualizado a estado {nuevo_estado} exitosamente."}, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def subsanar_ticket_supervisor(request, id_ticket):
    supervisor, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if supervisor.rol.lower() not in ROLES_SUPERVISOR:
        return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)

    comentario = request.data.get('descripcion_solucion') or request.data.get('comentario')
    foto_archivo = request.FILES.get('foto_evidencia') or request.FILES.get('fotografia')

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        # Aislamiento estricto: obliga a tener empresa y que coincida exactamente
        if not supervisor.id_empresa or ticket.id_empresa_id != supervisor.id_empresa_id:
            return Response({"error": "No tienes permiso para modificar este ticket."}, status=status.HTTP_403_FORBIDDEN)

        if ticket.estado.lower() == 'cerrado':
            return Response({"error": "No se puede subsanar un ticket cerrado."}, status=status.HTTP_400_BAD_REQUEST)

        ahora = datetime.now()
        ticket.estado = 'En Revisión'
        ticket.fecha_respuesta_supervisor = ahora.date()
        ticket.hora_respuesta_supervisor = ahora.time()
        ticket.save()

        if foto_archivo and ticket.id_observacion:
            nombre_archivo = f"subsanacion_tk_{ticket.id_ticket}_{uuid.uuid4().hex[:8]}_{foto_archivo.name}"
            ruta_carpeta = os.path.join(settings.MEDIA_ROOT, 'fotos')
            os.makedirs(ruta_carpeta, exist_ok=True)

            ruta_fisica = os.path.join(ruta_carpeta, nombre_archivo)
            with open(ruta_fisica, 'wb+') as destination:
                for chunk in foto_archivo.chunks():
                    destination.write(chunk)

            ruta_bd = f"{settings.MEDIA_URL}fotos/{nombre_archivo}"
            Fotografia.objects.create(
                id_observacion=ticket.id_observacion,
                url_fotografia=ruta_bd
            )

        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=supervisor,
            tipo_accion="Subsanación de Ticket",
            comentarios=comentario or "Envío de subsanación y evidencia realizado por el supervisor."
        )

        return Response({"mensaje": "Subsanación y evidencia registradas exitosamente."}, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def auditar_ticket_municipal(request, id_ticket):
    auditor, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if auditor.rol.lower() not in ROLES_MUNICIPALES:
        return Response({"error": "No tienes permisos para auditar y cerrar tickets."}, status=status.HTTP_403_FORBIDDEN)

    comentario = request.data.get('comentario') or request.data.get('motivo_rechazo')
    decision_final = request.data.get('estado')

    if decision_final not in ['Cerrado', 'Rechazado', 'Aprobado']:
        return Response(
            {"error": "Estado inválido. Solo se permite 'Cerrado' (o Aprobado) o 'Rechazado'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not decision_final or not comentario:
        return Response(
            {"error": "Debes enviar la decisión de estado y un comentario u observación."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        nuevo_estado = 'Cerrado' if decision_final in ['Cerrado', 'Aprobado'] else 'Rechazado'
        ticket.estado = nuevo_estado
        ticket.save()

        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=auditor,
            tipo_accion="Auditoría Municipal",
            comentarios=f"Decisión: {nuevo_estado}. Motivo/Comentario: {comentario}"
        )

        return Response({"mensaje": f"Ticket auditado exitosamente a estado {nuevo_estado}."}, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def detalle_ticket_view(request, id_ticket):
    usuario, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    rol_lower = usuario.rol.lower()
    if rol_lower not in (ROLES_MUNICIPALES + ROLES_EMPRESA_EXTERNA):
        return Response({"error": "No tienes permisos para consultar este ticket."}, status=status.HTTP_403_FORBIDDEN)

    try:
        tk = Ticket.objects.select_related('id_empresa', 'id_area', 'id_observacion').get(id_ticket=id_ticket)

        # Aislamiento estricto para roles de empresa externa
        if rol_lower in ROLES_EMPRESA_EXTERNA:
            if not usuario.id_empresa or tk.id_empresa_id != usuario.id_empresa_id:
                return Response(
                    {"error": "No tienes permiso para acceder a tickets de otra empresa."},
                    status=status.HTTP_403_FORBIDDEN
                )

        fotografias_objs = []
        if tk.id_observacion:
            fotografias_objs = Fotografia.objects.filter(id_observacion=tk.id_observacion)

        rutas_fotos = [f.url_fotografia for f in fotografias_objs]
        foto_original = rutas_fotos[0] if rutas_fotos else None

        motivo_rechazo = None
        if tk.estado.lower() == 'rechazado':
            ultimo_audit = HistorialTicket.objects.filter(
                id_ticket=tk, tipo_accion="Auditoría Municipal"
            ).order_by('fecha_accion').last()
            if ultimo_audit:
                motivo_rechazo = ultimo_audit.comentarios

        ultimo_historial = HistorialTicket.objects.filter(
            id_ticket=tk, tipo_accion="Subsanación de Ticket"
        ).order_by('fecha_accion').last()
        desc_solucion = ultimo_historial.comentarios if ultimo_historial else ""
        fecha_carga = (
            ultimo_historial.fecha_accion.strftime("%Y-%m-%d %H:%M")
            if ultimo_historial and ultimo_historial.fecha_accion
            else None
        )

        foto_evidencia = rutas_fotos[-1] if len(rutas_fotos) > 1 else None

        evidencia_data = None
        if foto_evidencia or desc_solucion or tk.estado.lower() in ['en revisión', 'en proceso']:
            evidencia_data = {
                "url_foto": foto_evidencia or foto_original,
                "descripcion_solucion": desc_solucion,
                "fecha_carga": fecha_carga
            }

        nombre_empresa = tk.id_empresa.razon_social if tk.id_empresa else "No asignada"

        data = {
            "id": tk.id_ticket,
            "id_ticket": tk.id_ticket,
            "id_observacion": tk.id_observacion.id_observacion if tk.id_observacion else None,
            "cod_consulta_externa": tk.cod_consulta_externa,
            "area_asignada": tk.id_area.nombre_area if tk.id_area else "General",
            "id_empresa": tk.id_empresa.id_empresa if tk.id_empresa else None,
            "empresa_nombre": nombre_empresa,
            "empresa_asignada": nombre_empresa,
            "razon_social": nombre_empresa,
            "prioridad": tk.prioridad,
            "descripcion": tk.descripcion,
            "descripcion_ticket": tk.descripcion,
            "estado": tk.estado,
            "motivo_rechazo": motivo_rechazo,
            "fecha_creacion": tk.fecha_creacion.strftime("%Y-%m-%d") if tk.fecha_creacion else None,
            "fecha_registro": tk.id_observacion.fecha_registro.strftime("%Y-%m-%d") if tk.id_observacion and tk.id_observacion.fecha_registro else None,
            "fecha_vencimiento": tk.fecha_vencimiento.strftime("%Y-%m-%d") if tk.fecha_vencimiento else None,
            "fecha_respuesta_supervisor": tk.fecha_respuesta_supervisor.strftime("%Y-%m-%d") if tk.fecha_respuesta_supervisor else None,
            "hora_respuesta_supervisor": tk.hora_respuesta_supervisor.strftime("%H:%M:%S") if tk.hora_respuesta_supervisor else None,
            "fotografias": [foto_original] if foto_original else [],
            "evidencia": evidencia_data,
            "ubicacion_observacion": tk.id_observacion.ubicacion_observacion if tk.id_observacion else "Sin dirección registrada"
        }

        return Response(data, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- USUARIOS Y EMPRESAS ---

@api_view(['POST'])
def registrar_usuario(request):
    creador, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if creador.rol.lower() not in ROLES_ADMIN:
        return Response(
            {"error": "Acceso denegado. Solo un Administrador puede registrar usuarios."},
            status=status.HTTP_403_FORBIDDEN
        )

    nombre = request.data.get('nombre')
    apellido = request.data.get('apellido')
    email = request.data.get('email')
    password = request.data.get('password')
    rol = request.data.get('rol')
    id_empresa = request.data.get('id_empresa')

    if not all([nombre, apellido, email, password, rol]):
        return Response(
            {"error": "Faltan datos obligatorios (nombre, apellido, email, password, rol)."},
            status=status.HTTP_400_BAD_REQUEST
        )

    roles_permitidos = [
        'Administrador',
        'Usuario Municipal',
        'Supervisor de Empresa Externa',
        'Fiscalizador',
        'Operario de Empresa Externa'
    ]
    if rol not in roles_permitidos:
        return Response({"error": f"Rol inválido. Debe ser uno de: {roles_permitidos}"}, status=status.HTTP_400_BAD_REQUEST)

    if Usuario.objects.filter(email=email).exists():
        return Response({"error": "Ya existe un usuario con este correo electrónico."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        empresa_vinculada = None
        if rol in ['Supervisor de Empresa Externa', 'Operario de Empresa Externa']:
            if not id_empresa:
                return Response(
                    {"error": f"Debes especificar el id_empresa para el rol {rol}."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            empresa_vinculada = Empresa.objects.get(id_empresa=id_empresa)

        nuevo_usuario = Usuario.objects.create(
            nombre=nombre,
            apellido=apellido,
            email=email,
            password=make_password(password),
            rol=rol,
            id_empresa=empresa_vinculada
        )

        return Response({
            "mensaje": "Usuario creado exitosamente.",
            "id_usuario": nuevo_usuario.id_usuario,
            "email": nuevo_usuario.email,
            "rol": nuevo_usuario.rol,
            "id_empresa": empresa_vinculada.id_empresa if empresa_vinculada else None
        }, status=status.HTTP_201_CREATED)

    except Empresa.DoesNotExist:
        return Response({"error": "La empresa especificada no existe en la base de datos."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def crear_empresa(request):
    creador, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    if creador.rol.lower() not in ROLES_ADMIN:
        return Response({"error": "Solo un Administrador puede crear empresas."}, status=status.HTTP_403_FORBIDDEN)

    if not request.data.get('razon_social') or not request.data.get('rut_empresa'):
        return Response(
            {"error": "La razón social y el RUT de la empresa son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        nueva_empresa = Empresa.objects.create(
            razon_social=request.data.get('razon_social'),
            rut_empresa=request.data.get('rut_empresa'),
            direccion_comercial=request.data.get('direccion_comercial'),
            direccion_base_nacimiento=request.data.get('direccion_base_nacimiento'),
            nombre_admin_contrato=request.data.get('nombre_admin_contrato'),
            email_admin_contrato=request.data.get('email_admin_contrato'),
            telefono_admin_contrato=request.data.get('telefono_admin_contrato'),
            nombre_supervisor=request.data.get('nombre_supervisor'),
            email_supervisor=request.data.get('email_supervisor'),
            telefono_supervisor=request.data.get('telefono_supervisor')
        )
        return Response({"mensaje": "Empresa creada", "id_empresa": nueva_empresa.id_empresa}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def consulta_externa_ticket(request, codigo):
    try:
        ticket = Ticket.objects.select_related('id_empresa').get(cod_consulta_externa=codigo)

        historial_qs = HistorialTicket.objects.filter(id_ticket=ticket).order_by('-fecha_accion')
        historial = [{"fecha": h.fecha_accion, "accion": h.tipo_accion} for h in historial_qs]

        data = {
            "codigo": ticket.cod_consulta_externa,
            "estado": ticket.estado,
            "prioridad": ticket.prioridad,
            "descripcion": ticket.descripcion,
            "fecha_creacion": ticket.fecha_creacion,
            "empresa_asignada": ticket.id_empresa.razon_social if ticket.id_empresa else "No asignada",
            "historial": historial
        }
        return Response(data, status=status.HTTP_200_OK)
    except Ticket.DoesNotExist:
        return Response({"error": "El código de ticket ingresado no existe."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def listar_empresas(request):
    usuario, error_resp = obtener_usuario_autenticado(request)
    if error_resp:
        return error_resp

    try:
        # Un supervisor u operario solo puede ver su propia empresa
        if usuario.rol.lower() in ROLES_EMPRESA_EXTERNA:
            if not usuario.id_empresa:
                return Response([], status=status.HTTP_200_OK)
            empresas = Empresa.objects.filter(id_empresa=usuario.id_empresa_id)
        else:
            empresas = Empresa.objects.all().order_by('razon_social')

        data = []
        for emp in empresas:
            data.append({
                "id_empresa": emp.id_empresa,
                "razon_social": emp.razon_social,
                "rut_empresa": emp.rut_empresa
            })

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
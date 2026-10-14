import base64
import uuid
import os
from datetime import timedelta, date
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.files.base import ContentFile
from django.core import signing
from django.contrib.auth.hashers import check_password, make_password
from .models import Usuario, ObservacionTerreno, Fotografia, Empresa, Area, Ticket, HistorialTicket

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    usuario = Usuario.objects.filter(email=email).first()

    if usuario and check_password(password, usuario.password):
        token = signing.dumps({'id_usuario': usuario.id_usuario})

        data = {
            "token": token,
            "usuario": {
                "id_usuario": usuario.id_usuario,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "rol": usuario.rol,
                "id_empresa": usuario.id_empresa.id_empresa if usuario.id_empresa else None
            }
        }
        return Response(data, status=status.HTTP_200_OK)
    
    return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def user_profile_view(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        usuario = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        return Response({
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "email": usuario.email,
            "rol": usuario.rol,
            "id_empresa": usuario.id_empresa.id_empresa if usuario.id_empresa else None
        }, status=status.HTTP_200_OK)
        
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Token inválido o usuario no encontrado."}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def observaciones_view(request):
    if request.method == 'GET':
        try:
            observaciones_pendientes = ObservacionTerreno.objects.filter(estado='Pendiente')
            
            data = []
            for obs in observaciones_pendientes:
                fotos = Fotografia.objects.filter(id_observacion=obs.id_observacion)
                rutas_fotos = [foto.url_fotografia for foto in fotos]
                
                data.append({
                    "id": obs.id_observacion,
                    "id_observacion": obs.id_observacion,
                    "fecha_registro": obs.fecha_registro,
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
        descripcion = request.data.get('descripcion')
        ubicacion = request.data.get('ubicacion_observacion')
        foto_b64 = request.data.get('fotografia_b64')

        fiscalizador = Usuario.objects.first()
        if not fiscalizador:
            return Response({"error": "No hay usuarios registrados"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            observacion = ObservacionTerreno.objects.create(
                id_fiscalizador=fiscalizador,
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
                "mensaje": "Observación registrada",
                "id_observacion": observacion.id_observacion,
                "estado": observacion.estado
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def convertir_observacion_a_ticket(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante o formato incorrecto."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        creador = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        roles_permitidos = ['administrador', 'admin', 'usuario municipal', 'municipal']
        if creador.rol.lower() not in roles_permitidos:
            return Response(
                {"error": f"Tu rol actual ({creador.rol}) no tiene permisos para convertir observaciones a tickets."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
    except signing.BadSignature:
        return Response({"error": "Token inválido o modificado. Acceso denegado."}, status=status.HTTP_401_UNAUTHORIZED)
    except Usuario.DoesNotExist:
        return Response({"error": "El usuario vinculado a este token ya no existe en el sistema."}, status=status.HTTP_404_NOT_FOUND)

    id_observacion = request.data.get('id_observacion')
    id_empresa = request.data.get('id_empresa')
    id_area = request.data.get('id_area')
    prioridad = request.data.get('prioridad', 'Alta')
    dias_plazo = int(request.data.get('dias_plazo', 5))
    descripcion_ticket = request.data.get('descripcion_ticket')

    try:
        observacion = ObservacionTerreno.objects.get(id_observacion=id_observacion)
        
        if observacion.estado == 'Convertido':
            return Response({"error": "Esta observación ya fue convertida a ticket."}, status=status.HTTP_400_BAD_REQUEST)

        empresa = Empresa.objects.filter(id_empresa=id_empresa).first() if id_empresa else Empresa.objects.first()
        area = Area.objects.filter(id_area=id_area).first() if id_area else Area.objects.first()

        if not empresa or not area:
            return Response({"error": "Debe existir al menos una empresa y área registradas en la BD."}, status=status.HTTP_400_BAD_REQUEST)

        supervisor = Usuario.objects.filter(id_empresa=empresa.id_empresa).first()

        codigo_tk = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
        fecha_venc = date.today() + timedelta(days=dias_plazo)

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
            cod_consulta_externa=codigo_tk
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
            "id_ticket": ticket.id_ticket
        }, status=status.HTTP_201_CREATED)

    except ObservacionTerreno.DoesNotExist:
        return Response({"error": "La observación indicada no existe."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def bandeja_supervisor(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        usuario = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        # Permitimos tanto a supervisores como a personal municipal y administradores
        roles_permitidos = ['supervisor de empresa externa', 'supervisor', 'usuario municipal', 'municipal', 'administrador', 'admin']
        if usuario.rol.lower() not in roles_permitidos:
            return Response({"error": "Acceso denegado. Rol incorrecto."}, status=status.HTTP_403_FORBIDDEN)
            
    except signing.BadSignature:
        return Response({"error": "Token inválido."}, status=status.HTTP_401_UNAUTHORIZED)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    try:
        # Si es municipal o admin, puede ver todos los tickets. Si es supervisor, solo los de su empresa.
        if usuario.rol.lower() in ['usuario municipal', 'municipal', 'administrador', 'admin']:
            tickets = Ticket.objects.all()
        else:
            tickets = Ticket.objects.filter(id_empresa=usuario.id_empresa)
        
        data = []
        for tk in tickets:
            data.append({
                "id": tk.id_ticket,
                "id_ticket": tk.id_ticket,
                "cod_consulta_externa": tk.cod_consulta_externa,
                "prioridad": tk.prioridad,
                "descripcion": tk.descripcion,
                "descripcion_ticket": tk.descripcion,
                "fecha_vencimiento": tk.fecha_vencimiento,
                "estado": tk.estado,
                "area_asignada": tk.id_area.nombre_area if tk.id_area else "General"
            })
            
        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def responder_ticket_supervisor(request, id_ticket):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        supervisor = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        roles_supervisor = ['supervisor de empresa externa', 'supervisor']
        if supervisor.rol.lower() not in roles_supervisor:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)

    comentario_respuesta = request.data.get('comentario')
    nuevo_estado = request.data.get('estado', 'Resuelto')

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        if supervisor.id_empresa and ticket.id_empresa != supervisor.id_empresa:
            return Response({"error": "No tienes permiso para modificar este ticket."}, status=status.HTTP_403_FORBIDDEN)

        ticket.estado = nuevo_estado
        ticket.save()

        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=supervisor,
            tipo_accion="Respuesta de Empresa",
            comentarios=comentario_respuesta
        )

        return Response({"mensaje": f"Ticket actualizado a estado {nuevo_estado} exitosamente."}, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def subsanar_ticket_supervisor(request, id_ticket):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        supervisor = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        roles_supervisor = ['supervisor de empresa externa', 'supervisor']
        if supervisor.rol.lower() not in roles_supervisor:
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)

    comentario = request.data.get('descripcion_solucion') or request.data.get('comentario')
    foto_archivo = request.FILES.get('foto_evidencia') or request.FILES.get('fotografia')

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        if supervisor.id_empresa and ticket.id_empresa != supervisor.id_empresa:
            return Response({"error": "No tienes permiso para modificar este ticket."}, status=status.HTTP_403_FORBIDDEN)

        ticket.estado = 'En Revisión'
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
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        auditor = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        roles_permitidos = ['administrador', 'admin', 'usuario municipal', 'municipal']
        if auditor.rol.lower() not in roles_permitidos:
            return Response({"error": "No tienes permisos para auditar y cerrar tickets."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)

    comentario = request.data.get('comentario') or request.data.get('motivo_rechazo')
    decision_final = request.data.get('estado') # Ej: 'Cerrado' o 'Rechazado'

    if decision_final not in ['Cerrado', 'Rechazado', 'Aprobado']:
        return Response({"error": "Estado inválido. Solo se permite 'Cerrado' (o Aprobado) o 'Rechazado'."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not decision_final or not comentario:
        return Response({"error": "Debes enviar la decisión de estado y un comentario u observación."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        # Si se aprueba, pasa a Cerrado. Si se rechaza, vuelve a Abierto/Pendiente para que el supervisor corrija.
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
    try:
        tk = Ticket.objects.get(id_ticket=id_ticket)
        
        # Obtener fotografías
        fotografias_objs = []
        if tk.id_observacion:
            fotografias_objs = Fotografia.objects.filter(id_observacion=tk.id_observacion)
        
        rutas_fotos = [f.url_fotografia for f in fotografias_objs]
        foto_original = rutas_fotos[0] if rutas_fotos else None
        
        # Buscar el último comentario de auditoría municipal si el ticket fue rechazado
        motivo_rechazo = None
        if tk.estado.lower() == 'rechazado':
            ultimo_audit = HistorialTicket.objects.filter(id_ticket=tk, tipo_accion="Auditoría Municipal").last()
            if ultimo_audit:
                motivo_rechazo = ultimo_audit.comentarios

        # Buscar la última subsanación del supervisor
        ultimo_historial = HistorialTicket.objects.filter(id_ticket=tk, tipo_accion="Subsanación de Ticket").last()
        desc_solucion = ultimo_historial.comentarios if ultimo_historial else ""
        fecha_carga = ultimo_historial.fecha.strftime("%Y-%m-%d %H:%M") if ultimo_historial and hasattr(ultimo_historial, 'fecha') else None

        foto_evidencia = rutas_fotos[-1] if len(rutas_fotos) > 1 else None

        evidencia_data = None
        if foto_evidencia or desc_solucion or tk.estado.lower() in ['en revisión', 'en proceso']:
            evidencia_data = {
                "url_foto": foto_evidencia or foto_original,
                "descripcion_solucion": desc_solucion,
                "fecha_carga": fecha_carga
            }

        data = {
            "id": tk.id_ticket,
            "id_ticket": tk.id_ticket,
            "id_observacion": tk.id_observacion.id_observacion if tk.id_observacion else None,
            "cod_consulta_externa": tk.cod_consulta_externa,
            "prioridad": tk.prioridad,
            "descripcion": tk.descripcion,
            "descripcion_ticket": tk.descripcion,
            "estado": tk.estado,
            "motivo_rechazo": motivo_rechazo,  # <-- NUEVO CAMPO ENVIADO AL FRONTEND
            "fecha_registro": tk.id_observacion.fecha_registro if tk.id_observacion else None,
            "fotografias": [foto_original] if foto_original else [],
            "evidencia": evidencia_data,
            "ubicacion_observacion": {
                "direccion": tk.id_observacion.ubicacion_observacion if tk.id_observacion else None
            } if tk.id_observacion else None
        }

        return Response(data, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def registrar_usuario(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        creador = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        if creador.rol.lower() not in ['administrador', 'admin']:
            return Response({"error": "Acceso denegado. Solo un Administrador puede registrar usuarios."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Token inválido."}, status=status.HTTP_401_UNAUTHORIZED)

    nombre = request.data.get('nombre')
    apellido = request.data.get('apellido')
    email = request.data.get('email')
    password = request.data.get('password')
    rol = request.data.get('rol')
    id_empresa = request.data.get('id_empresa')

    if not all([nombre, apellido, email, password, rol]):
        return Response({"error": "Faltan datos obligatorios (nombre, apellido, email, password, rol)."}, status=status.HTTP_400_BAD_REQUEST)

    roles_permitidos = ['Administrador', 'Usuario Municipal', 'Supervisor de Empresa Externa', 'Fiscalizador']
    if rol not in roles_permitidos:
        return Response({"error": f"Rol inválido. Debe ser uno de: {roles_permitidos}"}, status=status.HTTP_400_BAD_REQUEST)

    if Usuario.objects.filter(email=email).exists():
        return Response({"error": "Ya existe un usuario con este correo electrónico."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        empresa_vinculada = None
        if rol == 'Supervisor de Empresa Externa':
            if not id_empresa:
                return Response({"error": "Debes especificar el id_empresa para un Supervisor."}, status=status.HTTP_400_BAD_REQUEST)
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
            "rol": nuevo_usuario.rol
        }, status=status.HTTP_201_CREATED)

    except Empresa.DoesNotExist:
        return Response({"error": "La empresa especificada no existe en la base de datos."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
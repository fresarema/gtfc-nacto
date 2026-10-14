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
from django.contrib.auth.hashers import check_password
from .models import Usuario, ObservacionTerreno, Fotografia, Empresa, Area, Ticket, HistorialTicket

@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    # Busca al usuario en la base de datos
    usuario = Usuario.objects.filter(email=email).first()

    # check_password toma el texto plano ingresado y lo compara criptográficamente con el hash guardado
    if usuario and check_password(password, usuario.password):
        
        # Genera el token
        token = signing.dumps({'id_usuario': usuario.id_usuario})

        # Arma el JSON de respuesta
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
    
    # Si falla, devuelve error genérico por seguridad
    return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET', 'POST'])
def observaciones_view(request):
    
    # --------------------------------------------------------
    # MÉTODO GET: Listar observaciones para la bandeja municipal
    # --------------------------------------------------------
    if request.method == 'GET':
        try:
            # Filtra solo las que tienen estado 'Pendiente'
            observaciones_pendientes = ObservacionTerreno.objects.filter(estado='Pendiente')
            
            data = []
            for obs in observaciones_pendientes:
                # Busca las fotos asociadas a cada observación
                fotos = Fotografia.objects.filter(id_observacion=obs.id_observacion)
                rutas_fotos = [foto.url_fotografia for foto in fotos]
                
                # Arma el diccionario para el frontend
                data.append({
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

    # --------------------------------------------------------
    # MÉTODO POST: Crear nueva observación desde el móvil
    # --------------------------------------------------------
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
    # -------------------------------------------------------------------------
    # Extracción y validación de identidad vía Token JWT
    # -------------------------------------------------------------------------
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante o formato incorrecto. Usa 'Bearer <token>'"}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        # Desencripta el token enviado por el frontend
        payload = signing.loads(token)
        creador = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        # Validar que quien intenta crear el ticket tenga los permisos operativos correctos
        roles_permitidos = ['Administrador', 'Usuario Municipal'] # Asegúrate de que este string coincida exacto con lo que guardas en la BD
        
        if creador.rol not in roles_permitidos:
            return Response(
                {"error": f"Tu rol actual ({creador.rol}) no tiene permisos para convertir observaciones a tickets."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
    except signing.BadSignature:
        return Response({"error": "Token inválido o modificado. Acceso denegado."}, status=status.HTTP_401_UNAUTHORIZED)
    except Usuario.DoesNotExist:
        return Response({"error": "El usuario vinculado a este token ya no existe en el sistema."}, status=status.HTTP_404_NOT_FOUND)
    # -------------------------------------------------------------------------

    id_observacion = request.data.get('id_observacion')
    id_empresa = request.data.get('id_empresa')
    id_area = request.data.get('id_area')
    prioridad = request.data.get('prioridad')
    dias_plazo = int(request.data.get('dias_plazo', 5))
    descripcion_ticket = request.data.get('descripcion_ticket')

    try:
        observacion = ObservacionTerreno.objects.get(id_observacion=id_observacion)
        
        if observacion.estado == 'Convertido':
            return Response({"error": "Esta observación ya fue convertida a ticket."}, status=status.HTTP_400_BAD_REQUEST)

        # Extrae a la empresa, su área y su supervisor a cargo
        supervisor = Usuario.objects.filter(id_empresa=id_empresa).first()
        empresa = Empresa.objects.get(id_empresa=id_empresa)
        area = Area.objects.get(id_area=id_area)

        # Autogenera el código exigido (ej. TK-2026-A1B2)
        codigo_tk = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
        fecha_venc = date.today() + timedelta(days=dias_plazo)

        # Crea el Ticket Maestro asignando al 'creador' real que saca del token
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

        # Aplica la inmutabilidad creando el primer registro del Historial con el usuario real
        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=creador, 
            tipo_accion="Creación de Ticket",
            comentarios=f"Ticket generado formalmente a partir de la observación ID {observacion.id_observacion}."
        )

        # Actualiza la observación original
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
        supervisor = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        # Validar que efectivamente sea un Supervisor
        if supervisor.rol != 'Supervisor de Empresa Externa':
            return Response({"error": "Acceso denegado. Rol incorrecto."}, status=status.HTTP_403_FORBIDDEN)
            
    except signing.BadSignature:
        return Response({"error": "Token inválido."}, status=status.HTTP_401_UNAUTHORIZED)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    try:
        # Filtrar tickets asignados a LA EMPRESA de este supervisor
        tickets = Ticket.objects.filter(id_empresa=supervisor.id_empresa)
        
        data = []
        for tk in tickets:
            data.append({
                "id_ticket": tk.id_ticket,
                "cod_consulta_externa": tk.cod_consulta_externa,
                "prioridad": tk.prioridad,
                "descripcion": tk.descripcion,
                "fecha_vencimiento": tk.fecha_vencimiento,
                "estado": tk.estado,
                "area_asignada": tk.id_area.nombre_area
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
        
        if supervisor.rol != 'Supervisor de Empresa Externa':
            return Response({"error": "Acceso denegado."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)

    comentario_respuesta = request.data.get('comentario')
    nuevo_estado = request.data.get('estado')

    if nuevo_estado != 'Resuelto':
        return Response({"error": "El supervisor solo puede cambiar el estado a 'Resuelto'."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        # Seguridad: Verificar que el ticket realmente pertenezca a la empresa del supervisor
        if ticket.id_empresa != supervisor.id_empresa:
            return Response({"error": "No tienes permiso para modificar este ticket."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Actualizar el estado del ticket
        ticket.estado = nuevo_estado
        ticket.save()

        # 2. Dejar registro inmutable en el Historial
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
def auditar_ticket_municipal(request, id_ticket):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({"error": "Token de autorización faltante."}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    try:
        payload = signing.loads(token)
        auditor = Usuario.objects.get(id_usuario=payload.get('id_usuario'))
        
        # Validar que sea perfil municipal
        roles_permitidos = ['Administrador', 'Usuario Municipal']
        if auditor.rol not in roles_permitidos:
            return Response({"error": "No tienes permisos para auditar y cerrar tickets."}, status=status.HTTP_403_FORBIDDEN)
            
    except (signing.BadSignature, Usuario.DoesNotExist):
        return Response({"error": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)

    comentario_auditoria = request.data.get('comentario')
    decision_final = request.data.get('estado') # Ej: "Cerrado" (aprobado) o "Abierto" (rechazado)

    if decision_final not in ['Cerrado', 'Rechazado']:
        return Response({"error": "Estado inválido. La auditoría solo permite 'Cerrado' o 'Rechazado'."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not decision_final or not comentario_auditoria:
        return Response({"error": "Debes enviar la decisión de estado y un comentario de auditoría."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        ticket = Ticket.objects.get(id_ticket=id_ticket)

        # 1. Actualizar el estado final del ticket
        ticket.estado = decision_final
        ticket.save()

        # 2. Registrar la auditoría en el Historial
        HistorialTicket.objects.create(
            id_ticket=ticket,
            id_usuario=auditor,
            tipo_accion="Auditoría Municipal",
            comentarios=comentario_auditoria
        )

        return Response({"mensaje": f"Ticket auditado y actualizado a estado {decision_final}."}, status=status.HTTP_200_OK)

    except Ticket.DoesNotExist:
        return Response({"error": "Ticket no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
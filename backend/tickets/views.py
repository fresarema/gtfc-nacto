import base64
import uuid
import os
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.files.base import ContentFile
from django.core import signing
from django.contrib.auth.hashers import check_password
from .models import Usuario, ObservacionTerreno, Fotografia

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
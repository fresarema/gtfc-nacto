from django.db import models

class Empresa(models.Model):
    id_empresa = models.AutoField(primary_key=True)
    nombre_empresa = models.CharField(max_length=200)
    rut_empresa = models.CharField(max_length=12)

    class Meta:
        db_table = 'empresa'

class Area(models.Model):
    id_area = models.AutoField(primary_key=True)
    nombre_area = models.CharField(max_length=100)

    class Meta:
        db_table = 'area'

class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    # Se permite null porque los usuarios municipales no tienen empresa
    id_empresa = models.ForeignKey(Empresa, on_delete=models.SET_NULL, null=True, blank=True, db_column='id_empresa')
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    password = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=50)

    class Meta:
        db_table = 'usuario'

class ObservacionTerreno(models.Model):
    id_observacion = models.AutoField(primary_key=True)
    id_fiscalizador = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_fiscalizador')
    fecha_registro = models.DateField(auto_now_add=True)
    hora_registro = models.TimeField(auto_now_add=True)
    descripcion = models.TextField()
    ubicacion_observacion = models.JSONField()
    estado = models.CharField(max_length=50, default='Pendiente')

    class Meta:
        db_table = 'observacion_terreno'

class Fotografia(models.Model):
    id_fotografia = models.AutoField(primary_key=True)
    id_observacion = models.ForeignKey(ObservacionTerreno, on_delete=models.CASCADE, db_column='id_observacion')
    url_fotografia = models.CharField(max_length=255)

    class Meta:
        db_table = 'fotografia'

class Ticket(models.Model):
    id_ticket = models.AutoField(primary_key=True)
    id_observacion = models.ForeignKey(ObservacionTerreno, on_delete=models.RESTRICT, db_column='id_observacion')
    id_empresa = models.ForeignKey(Empresa, on_delete=models.RESTRICT, db_column='id_empresa')
    id_area = models.ForeignKey(Area, on_delete=models.RESTRICT, db_column='id_area')
    
    # Relaciones con Usuario requieren related_name cuando hay más de un ForeignKey a la misma tabla
    supervisor_ticket = models.ForeignKey(Usuario, related_name='tickets_supervisados', on_delete=models.RESTRICT, db_column='supervisor_ticket')
    creador_ticket = models.ForeignKey(Usuario, related_name='tickets_creados', on_delete=models.RESTRICT, db_column='creador_ticket')
    
    prioridad = models.CharField(max_length=50)
    descripcion = models.TextField() 
    dias_plazo = models.IntegerField()
    fecha_creacion = models.DateField(auto_now_add=True)
    hora_creacion = models.TimeField(auto_now_add=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    hora_vencimiento = models.TimeField(null=True, blank=True)
    estado = models.CharField(max_length=50, default='Abierto')
    cod_consulta_externa = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'ticket'


class HistorialTicket(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, db_column='id_ticket')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, db_column='id_usuario')
    
    # Inmutabilidad: Cada acción queda registrada con fecha y hora exactas
    fecha_accion = models.DateTimeField(auto_now_add=True)
    tipo_accion = models.CharField(max_length=100)
    comentarios = models.TextField()

    class Meta:
        db_table = 'historial_ticket'
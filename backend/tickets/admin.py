from django.contrib import admin
from .models import Usuario, ObservacionTerreno, Fotografia

# Registramos los modelos para que aparezcan en /admin/
admin.site.register(Usuario)
admin.site.register(ObservacionTerreno)
admin.site.register(Fotografia)
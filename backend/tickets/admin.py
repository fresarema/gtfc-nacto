from django.contrib import admin
from .models import Usuario, ObservacionTerreno, Fotografia, Empresa, Area, Ticket, HistorialTicket

# Registramos los modelos para que aparezcan en el panel de Django Admin
admin.site.register(Usuario)
admin.site.register(ObservacionTerreno)
admin.site.register(Fotografia)
admin.site.register(Empresa)
admin.site.register(Area)
admin.site.register(Ticket)
admin.site.register(HistorialTicket)
import React, { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapaZonasImpacto.css';

export interface TicketMapaItem {
  idClave: string;
  codigo: string;
  lat: number;
  lng: number;
  estado: string;
  empresa: string;
}

export type NivelImpacto = 'alto' | 'medio' | 'bajo';

export interface ZonaImpactoItem {
  idZona: string;
  lat: number;
  lng: number;
  cantidad: number;
  nivel: NivelImpacto;
  tickets: TicketMapaItem[];
}

export interface ComandoVistaMapa {
  tipo: 'flyTo' | 'bounds';
  coords?: [number, number];
  zoom?: number;
  puntos?: [number, number][];
  nonce: number;
}

interface MapaZonasImpactoProps {
  zonas: ZonaImpactoItem[];
  centro: [number, number];
  zoomInicial?: number;
  comandoVista: ComandoVistaMapa | null;
  onVerTicket?: (idTicket: string) => void;
}

const NIVEL_COLORES: Record<NivelImpacto, { color: string; fillColor: string }> = {
  alto: { color: '#b91c1c', fillColor: '#ef4444' },
  medio: { color: '#b45309', fillColor: '#f59e0b' },
  bajo: { color: '#0369a1', fillColor: '#0ea5e9' },
};

function ControlVistaMapa({ comando }: { comando: ComandoVistaMapa | null }) {
  const map = useMap();

  useEffect(() => {
    if (!comando) return;
    if (comando.tipo === 'flyTo' && comando.coords) {
      map.flyTo(comando.coords, comando.zoom ?? 14, { duration: 0.65 });
    } else if (comando.tipo === 'bounds' && comando.puntos?.length) {
      map.fitBounds(L.latLngBounds(comando.puntos), { padding: [40, 40], maxZoom: 15 });
    }
  }, [comando, map]);

  return null;
}

export default function MapaZonasImpacto({
  zonas,
  centro,
  zoomInicial = 13,
  comandoVista,
}: MapaZonasImpactoProps) {
  return (
    <section className="mapa-card" aria-label="Mapa de zonas de impacto">
      <MapContainer
        center={centro}
        zoom={zoomInicial}
        scrollWheelZoom
        className="leaflet-mapa"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ControlVistaMapa comando={comandoVista} />

        {zonas.map((zona) => {
          const estilos = NIVEL_COLORES[zona.nivel];
          return (
            <CircleMarker
              key={zona.idZona}
              center={[zona.lat, zona.lng]}
              radius={Math.min(34, 13 + zona.cantidad * 4)}
              pathOptions={{
                color: estilos.color,
                fillColor: estilos.fillColor,
                fillOpacity: 0.45,
                weight: 2,
              }}
            >
              <Popup>
                <div className="mapa-popup">
                  <strong>
                    {zona.cantidad} {zona.cantidad === 1 ? 'ticket' : 'tickets'} en zona
                  </strong>
                  <p className="mapa-popup-coords">
                    {zona.lat.toFixed(5)}, {zona.lng.toFixed(5)}
                  </p>
                  <ul className="mapa-popup-list">
                    {zona.tickets.slice(0, 5).map((item) => (
                      <li key={item.idClave}>
                        #{item.codigo} — {item.empresa}
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </section>
  );
}
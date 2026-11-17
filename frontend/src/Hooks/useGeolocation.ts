// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [geoStatus, setGeoStatus] = useState('Obteniendo ubicación GPS automática...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitud(position.coords.latitude.toString());
          setLongitud(position.coords.longitude.toString());
          setGeoStatus('Ubicación GPS fijada automáticamente.');
        },
        (error) => {
          console.error('Error de geolocalización:', error);
          setGeoStatus('No se pudo obtener el GPS automáticamente.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoStatus('La geolocalización no es compatible con este navegador.');
    }
  }, []);

  return { latitud, longitud, geoStatus };
}
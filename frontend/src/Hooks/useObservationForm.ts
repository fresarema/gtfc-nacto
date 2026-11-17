// src/hooks/useObservationForm.ts
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useObservationForm() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [idEmpresa, setIdEmpresa] = useState('');
  const [prioridad, setPrioridad] = useState('Normal (5 días)');
  const [plazo, setPlazo] = useState('5');
  const [descripcion, setDescripcion] = useState('');
  const [fotografiaB64, setFotografiaB64] = useState<string>('');

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/empresas/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresas(response.data);
    } catch (err) {
      console.error('Error al cargar el listado de empresas:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotografiaB64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const empresaSeleccionada = empresas.find(emp => String(emp.id_empresa) === String(idEmpresa));

  return {
    empresas,
    idEmpresa,
    setIdEmpresa,
    prioridad,
    setPrioridad,
    plazo,
    setPlazo,
    descripcion,
    setDescripcion,
    fotografiaB64,
    setFotografiaB64,
    handleImageChange,
    empresaSeleccionada
  };
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Helper para incluir el Token JWT en los headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// 1. Autenticación (Login)
export const loginUser = async (credentials: { email: string; password: string }) => {
  const response = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error("Credenciales inválidas o error en el servidor.");
  return await response.json();
};

// 2. Creación de Observación en Terreno (Fiscalizador)
export interface CreateObservationDTO {
  descripcion: string;
  ubicacion_observacion: {
    latitud: number | null;
    longitud: number | null;
    direccion: string;
  };
  fotografia_b64: string;
}

export const createObservation = async (data: CreateObservationDTO) => {
  const response = await fetch(`${API_URL}/observaciones/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.mensaje || "Error al registrar la observación en terreno.");
  }

  return await response.json();
};

// 3. Detalle del Ticket y Bitácora (Núcleo para el QA)
export const getTicketDetail = async (idTicket: number | string) => {
  const response = await fetch(`${API_URL}/tickets/${idTicket}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("No se pudo obtener el detalle del ticket.");
  return await response.json();
};

// 4. Ingresar Nueva Actuación (Respuesta o Cierre)
export interface CreateActionDTO {
  tipo_accion: "Respuesta" | "Cierre" | "Rechazo";
  comentarios: string;
  fotografias_b64: string[];
}

export const createTicketAction = async (idTicket: number | string, data: CreateActionDTO) => {
  const response = await fetch(`${API_URL}/tickets/${idTicket}/actuaciones/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al registrar la actuación.");
  return await response.json();
};
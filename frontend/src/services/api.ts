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

// 5. Obtener lista de observaciones pendientes (Bandeja Municipal / Admin)
export const getObservations = async () => {
  const response = await fetch(`${API_URL}/observaciones/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("No se pudo obtener el listado de observaciones.");
  return await response.json();
};

// 6. Convertir Observación a Ticket Oficial
export interface ConvertTicketDTO {
  id_observacion: number;
  id_empresa: number;
  id_area: number;
  prioridad: string;
  dias_plazo: number;
  descripcion_ticket: string;
}

export const convertObservationToTicket = async (data: ConvertTicketDTO) => {
  const response = await fetch(`${API_URL}/tickets/convertir/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.mensaje || "Error al convertir la observación en ticket.");
  }

  return await response.json();
};

// 7. Obtener tickets de la empresa del supervisor autenticado
export const getSupervisorTickets = async () => {
  const response = await fetch(`${API_URL}/tickets/supervisor/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("No se pudieron obtener los tickets del supervisor.");
  return await response.json();
};

// 8. Enviar respuesta / resolución del supervisor a un ticket específico
export interface ResponderTicketDTO {
  comentario: string;
  estado: "Resuelto" | "En Proceso" | "Rechazado";
}

export const responderTicketSupervisor = async (idTicket: number | string, data: ResponderTicketDTO) => {
  const response = await fetch(`${API_URL}/tickets/supervisor/${idTicket}/responder/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.mensaje || "Error al enviar la respuesta del ticket.");
  }

  return await response.json();
};
const TOKEN_KEY = "auth_token";
const EXPIRY_KEY = "auth_token_expiry";

// Tiempo de expiración por defecto: 8 horas (en milisegundos)
const DEFAULT_EXPIRE_TIME = 8 * 60 * 60 * 1000; 

/**
 * Guarda el token con un tiempo límite de expiración.
 * @param token Token devuelto por el backend
 * @param expiresInMs Tiempo de validez en ms (por defecto 8 horas)
 */
export const setSession = (token: string, expiresInMs: number = DEFAULT_EXPIRE_TIME): void => {
  const expiresAt = Date.now() + expiresInMs;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRY_KEY, expiresAt.toString());
};

/**
 * Obtiene el token activo. Si expiró o no existe, limpia la sesión y retorna null.
 */
export const getSessionToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (!token || !expiry) {
    clearSession();
    return null;
  }

  // Comprobar si la hora actual superó el tiempo de expiración
  if (Date.now() > Number(expiry)) {
    clearSession();
    return null;
  }

  return token;
};

/**
 * Elimina la sesión activa
 */
export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
};

/**
 * Retorna true si existe un token y aún no ha expirado
 */
export const isSessionValid = (): boolean => {
  return getSessionToken() !== null;
};
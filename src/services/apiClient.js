const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'sena_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || `Error en el servidor (${response.status}: ${response.statusText || 'Error inesperado'})`);
  }

  return data;
}

export async function apiDownload(path) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });

  if (!response.ok) {
    let message = 'No se pudo completar la descarga.';
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      message = `Error en el servidor (${response.status}: ${response.statusText || 'Error de descarga'})`;
    }
    throw new Error(message);
  }

  return response.blob();
}

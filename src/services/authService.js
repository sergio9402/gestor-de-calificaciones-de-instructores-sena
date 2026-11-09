import { apiRequest, clearToken, setToken } from './apiClient';

export async function login({ email, password, role }) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      rol: role === 'coordinator' ? 'coordinador' : role,
    }),
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || 'No se pudo iniciar sesión.');
  }
  if (response.token) setToken(response.token);

  return {
    ...response.data,
    name: response.data.nombre,
    role: response.data.rol === 'coordinador' ? 'coordinator' : response.data.rol,
  };
}

export async function requestPasswordReset(email) {
  const response = await apiRequest('/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!response.success) {
    throw new Error(response.message || 'No se pudo procesar la solicitud.');
  }
  return response.message;
}

export async function resetPassword({ token, password }) {
  const response = await apiRequest('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });

  if (!response.success) {
    throw new Error(response.message || 'No se pudo cambiar la contraseña.');
  }
  return response.message;
}

export function logout() {
  clearToken();
}

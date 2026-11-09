import { apiRequest } from './apiClient';

async function getData(path, options) {
  const response = await apiRequest(path, options);
  return response.data;
}

export function listUsers() {
  return getData('/management/users');
}

export function listFichas() {
  return getData('/management/fichas');
}

export function saveUser(id, user) {
  return getData(id ? `/management/users/${id}` : '/management/users', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(user),
  });
}

export function saveFicha(id, ficha) {
  return getData(id ? `/management/fichas/${id}` : '/management/fichas', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(ficha),
  });
}

export function deactivateRecord(path) {
  return getData(path, { method: 'DELETE' });
}

export function createFichaNotice(fichaId, notice) {
  return getData(`/management/fichas/${fichaId}/novedades`, {
    method: 'POST',
    body: JSON.stringify(notice),
  });
}

export function getLearnerSchedule() {
  return getData('/management/learner/schedule');
}

export function getInstructorFichas() {
  return getData('/management/instructor/fichas');
}

export function previewTestImport(payload) {
  return getData('/management/test-imports/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function confirmTestImport(payload) {
  return getData('/management/test-imports/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

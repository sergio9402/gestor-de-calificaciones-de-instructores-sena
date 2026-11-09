import { apiRequest } from './apiClient';

async function getData(path, options) {
  const response = await apiRequest(path, options);
  return response.data;
}

export function listInstructors() {
  return getData('/instructors');
}

export function getInstructorProfile(id) {
  return getData(`/instructors/${id}`);
}

export function getInstitutionalMetrics() {
  return getData('/instructors/metrics/summary');
}

export function updateInstructorStatus(id, estado) {
  return getData(`/instructors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

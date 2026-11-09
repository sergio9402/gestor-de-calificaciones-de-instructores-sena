import { apiRequest } from './apiClient';

export async function submitEvaluation({
  instructorId,
  fichaId,
  methodology,
  technicalDomain,
  comment,
}) {
  const response = await apiRequest('/evaluations', {
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      calificacionMetodologia: methodology,
      calificacionTecnica: technicalDomain,
      comentario: comment,
    }),
  });

  return response.data;
}

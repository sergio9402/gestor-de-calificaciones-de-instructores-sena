import { apiRequest } from './apiClient';

export async function getEvaluationRubric() {
  const response = await apiRequest('/evaluations/rubric');
  return response.data;
}

export async function submitEvaluation({ instructorId, fichaId, answers, comment }) {
  const response = await apiRequest('/evaluations', {
    method: 'POST',
    body: JSON.stringify({
      instructorId,
      fichaId,
      respuestas: answers,
      comentario: comment,
    }),
  });

  return response.data;
}

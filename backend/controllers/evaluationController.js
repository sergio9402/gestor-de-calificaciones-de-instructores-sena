const evaluationService = require('../services/evaluationService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Controlador Delgado (Slim Controller) para Evaluaciones Anónimas
 */
class EvaluationController {
  /**
   * Crea una nueva evaluación anónima y recalcula métricas
   * POST /api/evaluations
   */
  createEvaluation = asyncHandler(async (req, res) => {
    const result = await evaluationService.createEvaluation(req.body);

    res.status(201).json({
      success: true,
      message: 'Evaluación anónima registrada y promedios recalculados con éxito',
      data: result,
    });
  });

  /**
   * Obtiene todas las evaluaciones de un instructor específico
   * GET /api/evaluations/instructor/:instructorId
   */
  getInstructorEvaluations = asyncHandler(async (req, res) => {
    const evaluations = await evaluationService.getEvaluationsByInstructor(req.params.instructorId);

    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations,
    });
  });

  /**
   * Obtiene las evaluaciones más recientes registradas
   * GET /api/evaluations/recent
   */
  getRecentEvaluations = asyncHandler(async (req, res) => {
    const evaluations = await evaluationService.getRecentEvaluations(req.query.limit);

    res.status(200).json({
      success: true,
      count: evaluations.length,
      data: evaluations,
    });
  });
}

module.exports = new EvaluationController();


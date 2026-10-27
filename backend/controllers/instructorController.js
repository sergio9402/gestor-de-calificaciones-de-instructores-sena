const instructorService = require('../services/instructorService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * Controlador Delgado (Slim Controller) para Instructores y Fichas
 */
class InstructorController {
  /**
   * Obtiene la lista de instructores filtrados
   * GET /api/instructors
   */
  getInstructors = asyncHandler(async (req, res) => {
    const instructors = await instructorService.getInstructors(req.query);

    res.status(200).json({
      success: true,
      count: instructors.length,
      data: instructors,
    });
  });

  /**
   * Obtiene un instructor por su ID con sus fichas y valoraciones recientes
   * GET /api/instructors/:id
   */
  getInstructorById = asyncHandler(async (req, res) => {
    const instructor = await instructorService.getInstructorById(req.params.id);

    res.status(200).json({
      success: true,
      data: instructor,
    });
  });

  /**
   * Actualiza el estado operativo actual de un instructor
   * PATCH /api/instructors/:id/status
   */
  updateOperationalStatus = asyncHandler(async (req, res) => {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El campo "estado" es obligatorio en el cuerpo de la petición',
      });
    }

    const updated = await instructorService.updateOperationalStatus(req.params.id, estado);

    res.status(200).json({
      success: true,
      message: `Estado operativo actualizado a "${estado}"`,
      data: updated,
    });
  });

  /**
   * Obtiene el consolidado de métricas institucionales y competencias
   * GET /api/instructors/metrics/summary
   */
  getMetricsSummary = asyncHandler(async (req, res) => {
    const metrics = await instructorService.getInstitutionalMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  });
}

module.exports = new InstructorController();


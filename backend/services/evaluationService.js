const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

/**
 * Servicio de Lógica de Negocio para Evaluaciones
 */
class EvaluationService {
  /**
   * Registra una nueva evaluación y recalcula el promedio ponderado del instructor
   * @param {Object} evalData - Datos de la evaluación recibida
   * @returns {Object} Evaluación creada y estado actualizado del instructor
   */
  async createEvaluation(evalData) {
    const { instructorId, calificacionMetodologia, calificacionTecnica, comentario, esAnonimo } = evalData;

    // 1. Verificar existencia del instructor
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      const error = new Error('El instructor especificado no existe');
      error.statusCode = 404;
      throw error;
    }

    if (instructor.rol !== 'instructor') {
      const error = new Error('Solo se pueden evaluar usuarios con rol "instructor"');
      error.statusCode = 400;
      throw error;
    }

    // 2. Persistir el documento de evaluación
    const newEvaluation = await Evaluation.create({
      instructorId,
      calificacionMetodologia: Number(calificacionMetodologia),
      calificacionTecnica: Number(calificacionTecnica),
      comentario: comentario.trim(),
      esAnonimo: esAnonimo !== undefined ? esAnonimo : true,
      fecha: new Date(),
    });

    // 3. Lógica Pesada de Negocio: Recálculo de Promedio Ponderado
    const oldCount = instructor.totalEvaluaciones || 0;
    const newCount = oldCount + 1;

    const oldMethodology = instructor.promedioMetodologia || 5.0;
    const oldTechnical = instructor.promedioTecnico || 5.0;

    const updatedMethodology = Number(
      ((oldMethodology * oldCount + Number(calificacionMetodologia)) / newCount).toFixed(2)
    );

    const updatedTechnical = Number(
      ((oldTechnical * oldCount + Number(calificacionTecnica)) / newCount).toFixed(2)
    );

    const updatedGeneral = Number(
      ((updatedMethodology + updatedTechnical) / 2).toFixed(2)
    );

    // 4. Actualizar instructor en base de datos
    instructor.promedioMetodologia = updatedMethodology;
    instructor.promedioTecnico = updatedTechnical;
    instructor.promedioGeneral = updatedGeneral;
    instructor.totalEvaluaciones = newCount;
    await instructor.save();

    return {
      evaluation: newEvaluation,
      instructor: {
        id: instructor._id,
        nombre: instructor.nombre,
        promedioGeneral: instructor.promedioGeneral,
        promedioMetodologia: instructor.promedioMetodologia,
        promedioTecnico: instructor.promedioTecnico,
        totalEvaluaciones: instructor.totalEvaluaciones,
      },
    };
  }

  /**
   * Obtiene el historial de evaluaciones de un instructor específico
   * @param {String} instructorId - ID del instructor
   * @returns {Array} Lista de evaluaciones ordenadas por fecha
   */
  async getEvaluationsByInstructor(instructorId) {
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      const error = new Error('Instructor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const evaluations = await Evaluation.find({ instructorId })
      .sort({ fecha: -1 })
      .lean();

    return evaluations;
  }

  /**
   * Obtiene las evaluaciones más recientes de toda la institución
   */
  async getRecentEvaluations(limit = 10) {
    return await Evaluation.find()
      .populate('instructorId', 'nombre especialidad centro')
      .sort({ fecha: -1 })
      .limit(Number(limit))
      .lean();
  }
}

module.exports = new EvaluationService();


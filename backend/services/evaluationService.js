const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Ficha = require('../models/Ficha');
const EvaluationParticipation = require('../models/EvaluationParticipation');

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
    const {
      instructorId,
      fichaId,
      calificacionMetodologia,
      calificacionTecnica,
      comentario,
    } = evalData;

    // 1. Verificar existencia del instructor
    const instructor = await User.findOne({
      _id: instructorId,
      rol: 'instructor',
      activo: { $ne: false },
    });
    if (!instructor) {
      const error = new Error('El instructor especificado no existe');
      error.statusCode = 404;
      throw error;
    }

    if (!fichaId) {
      const error = new Error('Debes seleccionar una ficha asignada para evaluar.');
      error.statusCode = 400;
      throw error;
    }
    const ficha = await Ficha.findOne({
      _id: fichaId,
      $or: [
        { instructor: instructorId, 'sesiones.0': { $exists: false } },
        { 'sesiones.instructor': instructorId },
      ],
      aprendices: evalData.learnerId,
      activa: true,
    }).select('_id periodo');
    if (!ficha) {
      const error = new Error('No estás inscrito en una ficha activa de este instructor.');
      error.statusCode = 403;
      throw error;
    }

    try {
      await EvaluationParticipation.create({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo: ficha.periodo,
      });
    } catch (error) {
      if (error.code === 11000) {
        const duplicateError = new Error(
          'Ya registraste una evaluación para este instructor, ficha y periodo.'
        );
        duplicateError.statusCode = 409;
        throw duplicateError;
      }
      throw error;
    }

    let newEvaluation;
    try {
      newEvaluation = await Evaluation.create({
        instructorId,
        fichaId,
        periodo: ficha.periodo,
        calificacionMetodologia: Number(calificacionMetodologia),
        calificacionTecnica: Number(calificacionTecnica),
        comentario: comentario.trim(),
        esAnonimo: true,
        fecha: new Date(),
      });
    } catch (error) {
      await EvaluationParticipation.deleteOne({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo: ficha.periodo,
      });
      throw error;
    }

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
    try {
      await instructor.save();
    } catch (error) {
      await Evaluation.deleteOne({ _id: newEvaluation._id });
      await EvaluationParticipation.deleteOne({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo: ficha.periodo,
      });
      throw error;
    }

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
    const instructor = await User.findOne({ _id: instructorId, rol: 'instructor' });
    if (!instructor) {
      const error = new Error('Instructor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return Evaluation.aggregate([
      { $match: { instructorId: instructor._id } },
      {
        $group: {
          _id: { fichaId: '$fichaId', periodo: '$periodo' },
          totalEvaluaciones: { $sum: 1 },
          promedioMetodologia: { $avg: '$calificacionMetodologia' },
          promedioTecnico: { $avg: '$calificacionTecnica' },
          comentarios: { $push: '$comentario' },
        },
      },
      { $match: { totalEvaluaciones: { $gte: 5 } } },
      { $sort: { '_id.periodo': -1 } },
      {
        $project: {
          _id: 0,
          fichaId: '$_id.fichaId',
          periodo: '$_id.periodo',
          totalEvaluaciones: 1,
          promedioMetodologia: { $round: ['$promedioMetodologia', 2] },
          promedioTecnico: { $round: ['$promedioTecnico', 2] },
          comentarios: 1,
        },
      },
    ]);
  }

  /**
   * Obtiene las evaluaciones más recientes de toda la institución
   */
  async getRecentEvaluations(limit = 10) {
    const groups = await Evaluation.aggregate([
      {
        $group: {
          _id: {
            instructorId: '$instructorId',
            fichaId: '$fichaId',
            periodo: '$periodo',
          },
          totalEvaluaciones: { $sum: 1 },
          promedioMetodologia: { $avg: '$calificacionMetodologia' },
          promedioTecnico: { $avg: '$calificacionTecnica' },
          comentarios: { $push: '$comentario' },
        },
      },
      { $match: { totalEvaluaciones: { $gte: 5 } } },
      { $sort: { '_id.periodo': -1 } },
      { $limit: Math.min(Math.max(Number(limit) || 10, 1), 50) },
    ]);
    const instructorIds = [...new Set(groups.map((group) => String(group._id.instructorId)))];
    const instructors = await User.find({ _id: { $in: instructorIds } })
      .select('nombre especialidad centro')
      .lean();
    const instructorsById = new Map(
      instructors.map((instructor) => [String(instructor._id), instructor])
    );

    return groups.map((group) => ({
      instructor: instructorsById.get(String(group._id.instructorId)) || null,
      fichaId: group._id.fichaId,
      periodo: group._id.periodo,
      totalEvaluaciones: group.totalEvaluaciones,
      promedioMetodologia: Number(group.promedioMetodologia.toFixed(2)),
      promedioTecnico: Number(group.promedioTecnico.toFixed(2)),
      comentarios: group.comentarios,
    }));
  }
}

module.exports = new EvaluationService();

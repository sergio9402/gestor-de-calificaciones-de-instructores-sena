const Evaluation = require('../models/Evaluation');
const EvaluationAnswer = require('../models/EvaluationAnswer');
const InstructorProfile = require('../models/InstructorProfile');
const Ficha = require('../models/Ficha');
const EvaluationParticipation = require('../models/EvaluationParticipation');
const Enrollment = require('../models/Enrollment');
const Schedule = require('../models/Schedule');
const { questions } = require('../config/evaluationRubric');

const CURRENT_RUBRIC_VERSION = 2;
const MINIMUM_REPORTING_COUNT = 5;

const round = (value) => Number(value.toFixed(2));
const average = (scores) => scores.length
  ? round(scores.reduce((total, score) => total + score, 0) / scores.length)
  : 0;

function groupEvaluations(evaluations, answers) {
  const answersByEvaluation = new Map();
  for (const answer of answers) {
    const evaluationAnswers = answersByEvaluation.get(String(answer.evaluationId)) || [];
    evaluationAnswers.push(answer);
    answersByEvaluation.set(String(answer.evaluationId), evaluationAnswers);
  }

  const groups = new Map();
  for (const evaluation of evaluations) {
    const key = `${evaluation.instructorId}:${evaluation.fichaId}:${evaluation.periodo || ''}`;
    const group = groups.get(key) || {
      instructorId: evaluation.instructorId,
      fichaId: evaluation.fichaId,
      periodo: evaluation.periodo,
      totalEvaluaciones: 0,
      comentarios: [],
      scoreTotals: new Map(),
      scoreCounts: new Map(),
      legacyMethodologyTotal: 0,
      legacyTechnicalTotal: 0,
      legacyCount: 0,
    };
    group.totalEvaluaciones += 1;
    if (evaluation.comentario) group.comentarios.push(evaluation.comentario);
    const evaluationAnswers = answersByEvaluation.get(String(evaluation._id)) || [];
    if (evaluationAnswers.length) {
      for (const answer of evaluationAnswers) {
        if (answer.noAplica || !Number.isFinite(answer.score)) continue;
        group.scoreTotals.set(
          answer.criterionCode,
          (group.scoreTotals.get(answer.criterionCode) || 0) + answer.score
        );
        group.scoreCounts.set(
          answer.criterionCode,
          (group.scoreCounts.get(answer.criterionCode) || 0) + 1
        );
      }
    } else if (
      Number.isFinite(evaluation.calificacionMetodologia) &&
      Number.isFinite(evaluation.calificacionTecnica)
    ) {
      group.legacyMethodologyTotal += evaluation.calificacionMetodologia;
      group.legacyTechnicalTotal += evaluation.calificacionTecnica;
      group.legacyCount += 1;
    }
    groups.set(key, group);
  }

  return [...groups.values()].map((group) => {
    const criterios = Object.fromEntries(
      [...group.scoreTotals].map(([code, total]) => [
        code,
        round(total / group.scoreCounts.get(code)),
      ])
    );
    const categoryAverages = {};
    const categoryCounts = {};
    for (const category of new Set(questions.map((question) => question.categoryCode))) {
      const categoryQuestions = questions.filter((question) => question.categoryCode === category);
      const scoreTotal = categoryQuestions.reduce(
        (total, question) => total + (group.scoreTotals.get(question.code) || 0),
        0
      );
      const scoreCount = categoryQuestions.reduce(
        (total, question) => total + (group.scoreCounts.get(question.code) || 0),
        0
      );
      if (scoreCount) {
        categoryAverages[category] = round(scoreTotal / scoreCount);
        categoryCounts[category] = scoreCount;
      }
    }
    const legacyMethodology = group.legacyCount
      ? group.legacyMethodologyTotal / group.legacyCount
      : null;
    const legacyTechnical = group.legacyCount
      ? group.legacyTechnicalTotal / group.legacyCount
      : null;
    const generalScores = [
      ...[...group.scoreTotals].flatMap(([code, total]) =>
        Array(group.scoreCounts.get(code)).fill(total / group.scoreCounts.get(code))
      ),
      ...Array(group.legacyCount).fill(
        legacyMethodology !== null && legacyTechnical !== null
          ? (legacyMethodology + legacyTechnical) / 2
          : 0
      ),
    ];

    return {
      instructorId: group.instructorId,
      fichaId: group.fichaId,
      periodo: group.periodo,
      totalEvaluaciones: group.totalEvaluaciones,
      promedioMetodologia: criterios.metodologia ?? (legacyMethodology === null ? 0 : round(legacyMethodology)),
      promedioTecnico: criterios.dominio_tecnico ?? (legacyTechnical === null ? 0 : round(legacyTechnical)),
      promedioGeneral: generalScores.length
        ? round(generalScores.reduce((total, value) => total + value, 0) / generalScores.length)
        : 0,
      promediosPorCategoria: categoryAverages,
      respuestasPorCategoria: categoryCounts,
      promediosPorCriterio: criterios,
      comentarios: group.comentarios,
    };
  });
}

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
      respuestas,
      comentario,
    } = evalData;
    if (!Array.isArray(respuestas) || respuestas.length !== questions.length) {
      const error = new Error('Debes responder todos los criterios de la rúbrica vigente.');
      error.statusCode = 400;
      throw error;
    }
    const allowedCodes = new Set(questions.map((question) => question.code));
    const answerByCode = new Map();
    for (const answer of respuestas) {
      if (
        !answer ||
        typeof answer.codigo !== 'string' ||
        !allowedCodes.has(answer.codigo) ||
        answerByCode.has(answer.codigo) ||
        typeof answer.noAplica !== 'boolean' ||
        (answer.noAplica
          ? answer.calificacion !== null && answer.calificacion !== undefined
          : !Number.isInteger(answer.calificacion) ||
            answer.calificacion < 1 ||
            answer.calificacion > 5)
      ) {
        const error = new Error('Las respuestas deben contener una calificación entera de 1 a 5 para cada criterio vigente.');
        error.statusCode = 400;
        throw error;
      }
      answerByCode.set(answer.codigo, {
        score: answer.noAplica ? null : answer.calificacion,
        noAplica: answer.noAplica,
      });
    }
    if ([...allowedCodes].some((code) => !answerByCode.has(code))) {
      const error = new Error('Debes responder todos los criterios de la rúbrica vigente.');
      error.statusCode = 400;
      throw error;
    }
    if (typeof comentario !== 'string' || comentario.trim().length < 10) {
      const error = new Error('El comentario constructivo debe contener al menos 10 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verificar existencia del instructor
    const instructor = await InstructorProfile.findOne({
      _id: instructorId,
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
    const ficha = await Ficha.findOne({ _id: fichaId, activa: true })
      .populate('periodoId')
      .select('_id instructor periodoId');
    const enrollment = ficha && await Enrollment.exists({
      fichaId,
      aprendizId: evalData.learnerId,
      estado: 'activa',
    });
    const instructorHasSchedule = ficha && await Schedule.exists({
      fichaId,
      instructor: instructorId,
      activa: true,
    });
    const fichaHasSchedules = ficha && await Schedule.exists({ fichaId, activa: true });
    const instructorAssigned = Boolean(instructorHasSchedule) ||
      (!fichaHasSchedules && String(ficha?.instructor) === String(instructorId));
    if (!ficha || !enrollment || !instructorAssigned) {
      const error = new Error('No estás inscrito en una ficha activa de este instructor.');
      error.statusCode = 403;
      throw error;
    }
    const periodo = ficha.periodoId?.nombre;
    if (!periodo) {
      throw new Error('La ficha no tiene un periodo académico válido.');
    }

    try {
      await EvaluationParticipation.create({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo,
        periodoId: ficha.periodoId._id,
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
        periodo,
        periodoId: ficha.periodoId._id,
        rubricVersion: CURRENT_RUBRIC_VERSION,
        comentario: comentario.trim(),
        esAnonimo: true,
        fecha: new Date(),
      });
      await EvaluationAnswer.create(
        questions.map((question) => ({
          evaluationId: newEvaluation._id,
          criterionCode: question.code,
          categoryCode: question.categoryCode,
          score: answerByCode.get(question.code).score,
          noAplica: answerByCode.get(question.code).noAplica,
        }))
      );
    } catch (error) {
      if (newEvaluation) {
        await EvaluationAnswer.deleteMany({ evaluationId: newEvaluation._id });
        await Evaluation.deleteOne({ _id: newEvaluation._id });
      }
      await EvaluationParticipation.deleteOne({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo,
      });
      throw error;
    }

    // 3. Lógica Pesada de Negocio: Recálculo de Promedio Ponderado
    let profile;
    try {
      const allEvaluations = await Evaluation.find({ instructorId }).lean();
      const allAnswers = await EvaluationAnswer.find({
        evaluationId: { $in: allEvaluations.map((evaluation) => evaluation._id) },
      }).lean();
      const legacyEvaluations = allEvaluations.filter(
        (evaluation) => evaluation.rubricVersion !== CURRENT_RUBRIC_VERSION
      );
      const methodologyScores = [
        ...allAnswers.filter((answer) => answer.criterionCode === 'metodologia')
          .map((answer) => answer.score).filter(Number.isFinite),
        ...legacyEvaluations.map((evaluation) => evaluation.calificacionMetodologia)
          .filter(Number.isFinite),
      ];
      const technicalScores = [
        ...allAnswers.filter((answer) => answer.criterionCode === 'dominio_tecnico')
          .map((answer) => answer.score).filter(Number.isFinite),
        ...legacyEvaluations.map((evaluation) => evaluation.calificacionTecnica)
          .filter(Number.isFinite),
      ];
      const allScores = [
        ...allAnswers.map((answer) => answer.score).filter(Number.isFinite),
        ...legacyEvaluations.flatMap((evaluation) => [
          evaluation.calificacionMetodologia,
          evaluation.calificacionTecnica,
        ]).filter(Number.isFinite),
      ];
      profile = await InstructorProfile.findById(instructorId);
      if (!profile) throw new Error('No se encontró el perfil del instructor al actualizar promedios.');
      profile.promedioMetodologia = average(methodologyScores);
      profile.promedioTecnico = average(technicalScores);
      profile.promedioGeneral = average(allScores);
      profile.totalEvaluaciones = allEvaluations.length;
      await profile.save();
    } catch (error) {
      await EvaluationAnswer.deleteMany({ evaluationId: newEvaluation._id });
      await Evaluation.deleteOne({ _id: newEvaluation._id });
      await EvaluationParticipation.deleteOne({
        learnerId: evalData.learnerId,
        fichaId,
        instructorId,
        periodo,
      });
      throw error;
    }

    return {
      evaluation: newEvaluation,
      instructor: {
        id: profile._id,
        nombre: profile.nombre,
        promedioGeneral: profile.promedioGeneral,
        promedioMetodologia: profile.promedioMetodologia,
        promedioTecnico: profile.promedioTecnico,
        totalEvaluaciones: profile.totalEvaluaciones,
      },
    };
  }

  /**
   * Obtiene el historial de evaluaciones de un instructor específico
   * @param {String} instructorId - ID del instructor
   * @returns {Array} Lista de evaluaciones ordenadas por fecha
   */
  async getEvaluationsByInstructor(instructorId) {
    const instructor = await InstructorProfile.findById(instructorId);
    if (!instructor) {
      const error = new Error('Instructor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return this.getConsolidatedEvaluations({ instructorId: instructor._id });
  }

  /**
   * Obtiene las evaluaciones más recientes de toda la institución
   */
  async getRecentEvaluations(limit = 10) {
    const groups = await this.getConsolidatedEvaluations({
      limit: Math.min(Math.max(Number(limit) || 10, 1), 50),
    });
    const instructorIds = [...new Set(groups.map((group) => String(group.instructorId)))];
    const instructors = await InstructorProfile.find({ _id: { $in: instructorIds } })
      .select('nombre especialidad centro')
      .lean();
    const instructorsById = new Map(
      instructors.map((instructor) => [
        String(instructor._id),
        instructor,
      ])
    );

    return groups.map((group) => ({
      instructor: instructorsById.get(String(group.instructorId)) || null,
      fichaId: group.fichaId,
      periodo: group.periodo,
      totalEvaluaciones: group.totalEvaluaciones,
      promedioMetodologia: group.promedioMetodologia,
      promedioTecnico: group.promedioTecnico,
      promedioGeneral: group.promedioGeneral,
      promediosPorCategoria: group.promediosPorCategoria,
      respuestasPorCategoria: group.respuestasPorCategoria,
      promediosPorCriterio: group.promediosPorCriterio,
      comentarios: group.comentarios,
    }));
  }

  async getConsolidatedEvaluations({ instructorId, limit = 50 } = {}) {
    const filter = {};
    if (instructorId) filter.instructorId = instructorId;
    const evaluations = await Evaluation.find(filter)
      .select('instructorId fichaId periodo comentario fecha rubricVersion calificacionMetodologia calificacionTecnica')
      .sort({ fecha: -1 })
      .lean();
    if (evaluations.length === 0) return [];
    const answers = await EvaluationAnswer.find({
      evaluationId: { $in: evaluations.map((evaluation) => evaluation._id) },
    }).lean();
    return groupEvaluations(evaluations, answers)
      .filter((group) => group.totalEvaluaciones >= MINIMUM_REPORTING_COUNT)
      .sort((left, right) => String(right.periodo || '').localeCompare(String(left.periodo || '')))
      .slice(0, limit);
  }
}

module.exports = new EvaluationService();

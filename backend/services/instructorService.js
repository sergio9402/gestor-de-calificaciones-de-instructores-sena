const User = require('../models/User');
const evaluationService = require('./evaluationService');

/**
 * Servicio de Lógica de Negocio para Instructores y Fichas
 */
class InstructorService {
  /**
   * Obtiene la lista de instructores aplicando filtros dinámicos y ordenamiento
   * @param {Object} queryParams - Parámetros de consulta (estado, especialidad, búsqueda)
   */
  async getInstructors(queryParams = {}) {
    const { estado, especialidad, search, sort = 'promedioGeneral' } = queryParams;

    const filter = { rol: 'instructor', activo: { $ne: false } };

    if (estado && estado !== 'ALL') {
      filter.estado = estado;
    }

    if (especialidad) {
      filter.especialidad = new RegExp(especialidad, 'i');
    }

    if (search) {
      filter.$or = [
        { nombre: new RegExp(search, 'i') },
        { especialidad: new RegExp(search, 'i') },
        { fichasAsignadas: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOption = {};
    if (sort === 'promedioGeneral') sortOption.promedioGeneral = -1;
    else if (sort === 'totalEvaluaciones') sortOption.totalEvaluaciones = -1;
    else if (sort === 'nombre') sortOption.nombre = 1;
    else sortOption.createdAt = -1;

    return await User.find(filter)
      .select(
        'nombre especialidad fichasAsignadas estado centro avatar horario promedioMetodologia promedioTecnico promedioGeneral totalEvaluaciones'
      )
      .sort(sortOption)
      .lean();
  }

  /**
   * Obtiene el perfil completo de un instructor con sus fichas y sus últimas evaluaciones
   */
  async getInstructorById(id) {
    const instructor = await User.findOne({
      _id: id,
      rol: 'instructor',
      activo: { $ne: false },
    }).lean();

    if (!instructor) {
      const error = new Error('Instructor no encontrado en el sistema');
      error.statusCode = 404;
      throw error;
    }

    const recentEvaluations = await evaluationService.getEvaluationsByInstructor(id);

    return {
      ...instructor,
      evaluacionesConsolidadas: recentEvaluations,
    };
  }

  /**
   * Actualiza el estado operativo actual de un instructor (En Formación, Asesoría, etc.)
   */
  async updateOperationalStatus(id, nuevoEstado) {
    const validStates = ['En Formación', 'Asesoría Técnica', 'Disponible', 'En Reunión'];

    if (!validStates.includes(nuevoEstado)) {
      const error = new Error(`Estado no válido. Los estados permitidos son: ${validStates.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const updatedInstructor = await User.findOneAndUpdate(
      { _id: id, rol: 'instructor', activo: { $ne: false } },
      { estado: nuevoEstado },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedInstructor) {
      const error = new Error('Instructor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return updatedInstructor;
  }

  /**
   * Genera el consolidado de métricas institucionales y de competencias docentes
   */
  async getInstitutionalMetrics() {
    const instructors = await User.find({
      rol: 'instructor',
      activo: { $ne: false },
    }).lean();

    if (instructors.length === 0) {
      return {
        totalInstructores: 0,
        promedioGlobal: 0,
        promedioMetodologia: 0,
        promedioTecnico: 0,
        totalEvaluaciones: 0,
        distribucionEstados: {},
      };
    }

    const evaluatedInstructors = instructors.filter((instructor) => instructor.totalEvaluaciones > 0);
    const totalEvaluaciones = evaluatedInstructors.reduce(
      (acc, curr) => acc + curr.totalEvaluaciones,
      0
    );
    const sumGeneral = evaluatedInstructors.reduce(
      (acc, curr) => acc + curr.promedioGeneral * curr.totalEvaluaciones,
      0
    );
    const sumMetodologia = evaluatedInstructors.reduce(
      (acc, curr) => acc + curr.promedioMetodologia * curr.totalEvaluaciones,
      0
    );
    const sumTecnico = evaluatedInstructors.reduce(
      (acc, curr) => acc + curr.promedioTecnico * curr.totalEvaluaciones,
      0
    );

    const distribucionEstados = {
      enFormacion: instructors.filter((i) => i.estado === 'En Formación').length,
      enAsesoria: instructors.filter((i) => i.estado === 'Asesoría Técnica').length,
      disponible: instructors.filter((i) => i.estado === 'Disponible').length,
      enReunion: instructors.filter((i) => i.estado === 'En Reunión').length,
    };

    return {
      totalInstructores: instructors.length,
      promedioGlobal: totalEvaluaciones ? Number((sumGeneral / totalEvaluaciones).toFixed(2)) : 0,
      promedioMetodologia: totalEvaluaciones
        ? Number((sumMetodologia / totalEvaluaciones).toFixed(2))
        : 0,
      promedioTecnico: totalEvaluaciones
        ? Number((sumTecnico / totalEvaluaciones).toFixed(2))
        : 0,
      totalEvaluaciones,
      distribucionEstados,
    };
  }
}

module.exports = new InstructorService();

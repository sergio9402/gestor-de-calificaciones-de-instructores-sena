const User = require('../models/User');
const Evaluation = require('../models/Evaluation');

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

    const filter = { rol: 'instructor' };

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

    return await User.find(filter).sort(sortOption).lean();
  }

  /**
   * Obtiene el perfil completo de un instructor con sus fichas y sus últimas evaluaciones
   */
  async getInstructorById(id) {
    const instructor = await User.findOne({ _id: id, rol: 'instructor' }).lean();

    if (!instructor) {
      const error = new Error('Instructor no encontrado en el sistema');
      error.statusCode = 404;
      throw error;
    }

    const recentEvaluations = await Evaluation.find({ instructorId: id })
      .sort({ fecha: -1 })
      .limit(5)
      .lean();

    return {
      ...instructor,
      ultimasEvaluaciones: recentEvaluations,
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
      { _id: id, rol: 'instructor' },
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
    const instructors = await User.find({ rol: 'instructor' }).lean();

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

    const totalEvaluaciones = instructors.reduce((acc, curr) => acc + (curr.totalEvaluaciones || 0), 0);
    const sumGeneral = instructors.reduce((acc, curr) => acc + (curr.promedioGeneral || 0), 0);
    const sumMetodologia = instructors.reduce((acc, curr) => acc + (curr.promedioMetodologia || 0), 0);
    const sumTecnico = instructors.reduce((acc, curr) => acc + (curr.promedioTecnico || 0), 0);

    const distribucionEstados = {
      enFormacion: instructors.filter((i) => i.estado === 'En Formación').length,
      enAsesoria: instructors.filter((i) => i.estado === 'Asesoría Técnica').length,
      disponible: instructors.filter((i) => i.estado === 'Disponible').length,
      enReunion: instructors.filter((i) => i.estado === 'En Reunión').length,
    };

    return {
      totalInstructores: instructors.length,
      promedioGlobal: Number((sumGeneral / instructors.length).toFixed(2)),
      promedioMetodologia: Number((sumMetodologia / instructors.length).toFixed(2)),
      promedioTecnico: Number((sumTecnico / instructors.length).toFixed(2)),
      totalEvaluaciones,
      distribucionEstados,
    };
  }
}

module.exports = new InstructorService();


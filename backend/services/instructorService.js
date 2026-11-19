const InstructorProfile = require('../models/InstructorProfile');
const evaluationService = require('./evaluationService');

const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function averageCategoryGroups(groups) {
  const totals = new Map();
  for (const group of groups) {
    for (const [categoryCode, score] of Object.entries(group.promediosPorCategoria || {})) {
      const count = group.respuestasPorCategoria[categoryCode];
      if (!count) continue;
      const entry = totals.get(categoryCode) || { score: 0, count: 0 };
      entry.score += score * count;
      entry.count += count;
      totals.set(categoryCode, entry);
    }
  }
  return Object.fromEntries([...totals].map(([categoryCode, value]) => [
    categoryCode,
    Number((value.score / value.count).toFixed(2)),
  ]));
}

class InstructorService {
  async getInstructors(queryParams = {}) {
    const { estado, especialidad, search, sort = 'promedioGeneral' } = queryParams;
    const filter = {};
    if (estado && estado !== 'ALL') filter.estado = estado;
    if (especialidad) filter.especialidad = new RegExp(escapeRegex(especialidad), 'i');

    if (search) {
      const safeSearch = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { nombre: safeSearch },
        { email: safeSearch },
        { especialidad: safeSearch },
        { fichasAsignadas: { $in: [safeSearch] } },
      ];
    }

    const sortOption = {};
    if (sort === 'promedioGeneral') sortOption.promedioGeneral = -1;
    else if (sort === 'totalEvaluaciones') sortOption.totalEvaluaciones = -1;
    else sortOption.createdAt = -1;

    const profiles = await InstructorProfile.find({ ...filter, activo: { $ne: false } })
      .select('-password -authVersion -documento -tipoDocumento')
      .sort(sortOption)
      .lean();
    const instructors = profiles;
    if (sort === 'nombre') {
      instructors.sort((left, right) => left.nombre.localeCompare(right.nombre, 'es', {
        sensitivity: 'base',
      }));
    }
    if (!instructors.length) return [];

    const consolidatedGroups = await evaluationService.getConsolidatedEvaluations({
      limit: 10000,
    });
    const categoryGroupsByInstructor = new Map();
    for (const group of consolidatedGroups) {
      const instructorKey = String(group.instructorId);
      const groups = categoryGroupsByInstructor.get(instructorKey) || [];
      groups.push(group);
      categoryGroupsByInstructor.set(instructorKey, groups);
    }

    return instructors.map((instructor) => ({
      ...instructor,
      promediosPorCategoria: averageCategoryGroups(
        categoryGroupsByInstructor.get(String(instructor._id)) || []
      ),
    }));
  }

  async getInstructorById(id) {
    const instructor = await InstructorProfile.findOne({ _id: id, activo: { $ne: false } })
      .select('-password -authVersion')
      .lean();
    if (!instructor) {
      throw httpError(404, 'Instructor no encontrado en el sistema');
    }

    const recentEvaluations = await evaluationService.getEvaluationsByInstructor(id);
    return {
      ...instructor,
      evaluacionesConsolidadas: recentEvaluations,
    };
  }

  async updateOperationalStatus(id, nuevoEstado) {
    const validStates = ['En Formación', 'Asesoría Técnica', 'Disponible', 'En Reunión'];
    if (!validStates.includes(nuevoEstado)) {
      throw httpError(400, `Estado no válido. Los estados permitidos son: ${validStates.join(', ')}`);
    }

    const updatedInstructor = await InstructorProfile.findOneAndUpdate(
      { _id: id, activo: { $ne: false } },
      { estado: nuevoEstado },
      { new: true, runValidators: true }
    ).select('-password -authVersion').lean();
    if (!updatedInstructor) throw httpError(404, 'Instructor no encontrado');

    return updatedInstructor;
  }

  async getInstitutionalMetrics() {
    const activeInstructors = await InstructorProfile.find({ activo: { $ne: false } })
      .select('-password -authVersion')
      .lean();

    if (!activeInstructors.length) {
      return {
        totalInstructores: 0,
        promedioGlobal: 0,
        promedioMetodologia: 0,
        promedioTecnico: 0,
        promediosPorCategoria: {},
        totalEvaluaciones: 0,
        distribucionEstados: {},
      };
    }

    const evaluatedInstructors = activeInstructors.filter((instructor) => instructor.totalEvaluaciones > 0);
    const totalEvaluaciones = evaluatedInstructors.reduce(
      (total, instructor) => total + instructor.totalEvaluaciones,
      0
    );
    const weightedAverage = (field) => totalEvaluaciones
      ? Number((evaluatedInstructors.reduce(
        (total, instructor) => total + (instructor[field] || 0) * instructor.totalEvaluaciones,
        0
      ) / totalEvaluaciones).toFixed(2))
      : 0;
    const consolidatedGroups = await evaluationService.getConsolidatedEvaluations({
      limit: 10000,
    });

    return {
      totalInstructores: activeInstructors.length,
      promedioGlobal: weightedAverage('promedioGeneral'),
      promedioMetodologia: weightedAverage('promedioMetodologia'),
      promedioTecnico: weightedAverage('promedioTecnico'),
      promediosPorCategoria: averageCategoryGroups(consolidatedGroups),
      totalEvaluaciones,
      distribucionEstados: {
        enFormacion: activeInstructors.filter((instructor) => instructor.estado === 'En Formación').length,
        enAsesoria: activeInstructors.filter((instructor) => instructor.estado === 'Asesoría Técnica').length,
        disponible: activeInstructors.filter((instructor) => instructor.estado === 'Disponible').length,
        enReunion: activeInstructors.filter((instructor) => instructor.estado === 'En Reunión').length,
      },
    };
  }
}

module.exports = new InstructorService();

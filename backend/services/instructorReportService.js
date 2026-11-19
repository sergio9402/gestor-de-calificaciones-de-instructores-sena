const PDFDocument = require('pdfkit');
const Ficha = require('../models/Ficha');
const InstructorProfile = require('../models/InstructorProfile');
const { rubric } = require('../config/evaluationRubric');
const evaluationService = require('./evaluationService');

function getWeightedAverage(groups, getScore, getCount) {
  let totalScore = 0;
  let totalCount = 0;
  for (const group of groups) {
    const score = getScore(group);
    const count = getCount(group);
    if (!Number.isFinite(score) || !Number.isFinite(count) || count <= 0) continue;
    totalScore += score * count;
    totalCount += count;
  }
  return totalCount ? Number((totalScore / totalCount).toFixed(2)) : null;
}

async function getInstructorReportData(instructorId) {
  const instructor = await InstructorProfile.findOne({
    _id: instructorId,
    activo: { $ne: false },
  }).select('nombre').lean();
  if (!instructor) {
    const error = new Error('Instructor no encontrado en el sistema');
    error.statusCode = 404;
    throw error;
  }

  const groups = await evaluationService.getEvaluationsByInstructor(instructorId);
  const fichaIds = [...new Set(groups.map((group) => String(group.fichaId)))];
  const fichas = await Ficha.find({ _id: { $in: fichaIds } })
    .select('codigo')
    .lean();
  const fichasById = new Map(fichas.map((ficha) => [String(ficha._id), ficha]));

  return {
    instructorName: instructor.nombre,
    totalEvaluaciones: groups.reduce((total, group) => total + group.totalEvaluaciones, 0),
    promedioGeneral: getWeightedAverage(
      groups,
      (group) => group.promedioGeneral,
      (group) => group.totalEvaluaciones
    ),
    promediosPorCategoria: Object.fromEntries(rubric.map((category) => [
      category.code,
      getWeightedAverage(
        groups,
        (group) => group.promediosPorCategoria[category.code],
        (group) => group.respuestasPorCategoria[category.code]
      ),
    ])),
    groups: groups.map((group) => ({
      ...group,
      fichaCodigo: fichasById.get(String(group.fichaId))?.codigo || 'Sin código',
    })),
  };
}

function addSectionTitle(document, title) {
  if (document.y > document.page.height - document.page.margins.bottom - 48) {
    document.addPage();
  }
  document.moveDown(0.7);
  document.font('Helvetica-Bold').fontSize(13).fillColor('#00324D').text(title);
  document.moveDown(0.35);
}

async function generateInstructorReportPdf(instructorId) {
  const report = await getInstructorReportData(instructorId);

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 52, size: 'LETTER' });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.font('Helvetica-Bold').fontSize(20).fillColor('#00324D')
      .text('Informe de evaluaciones y retroalimentación');
    document.moveDown(0.4);
    document.font('Helvetica').fontSize(11).fillColor('#334155')
      .text(`Instructor: ${report.instructorName}`);
    document.text(`Generado: ${new Date().toLocaleString('es-CO')}`);
    document.text('Los resultados y comentarios de este informe son anónimos.');

    addSectionTitle(document, 'Promedios');
    if (report.promedioGeneral === null) {
      document.font('Helvetica').fontSize(10).fillColor('#475569')
        .text('Aún no hay grupos con el mínimo de cinco evaluaciones para publicar resultados.');
    } else {
      document.font('Helvetica').fontSize(11).fillColor('#1e293b')
        .text(`Promedio general: ${report.promedioGeneral.toFixed(2)} / 5.00`);
      document.text(`Evaluaciones incluidas en grupos publicables: ${report.totalEvaluaciones}`);
      for (const category of rubric) {
        const average = report.promediosPorCategoria[category.code];
        document.text(`${category.name}: ${average === null ? 'Sin resultados' : `${average.toFixed(2)} / 5.00`}`);
      }
    }

    addSectionTitle(document, 'Retroalimentación anónima por grupo');
    if (!report.groups.length) {
      document.font('Helvetica').fontSize(10).fillColor('#475569')
        .text('Los comentarios estarán disponibles cuando un grupo alcance cinco evaluaciones.');
    }
    for (const group of report.groups) {
      addSectionTitle(document, `Ficha ${group.fichaCodigo} - Periodo ${group.periodo || 'Sin periodo'}`);
      document.font('Helvetica').fontSize(10).fillColor('#334155')
        .text(`${group.totalEvaluaciones} evaluaciones · Promedio ${group.promedioGeneral.toFixed(2)} / 5.00`);
      for (const comment of group.comentarios) {
        document.moveDown(0.35);
        document.font('Helvetica').fontSize(10).fillColor('#1e293b')
          .text(`- ${comment}`, { indent: 12 });
      }
    }

    document.end();
  });
}

module.exports = { generateInstructorReportPdf, getInstructorReportData };

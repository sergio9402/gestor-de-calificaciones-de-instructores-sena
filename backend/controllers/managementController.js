const managementService = require('../services/managementService');
const testImportService = require('../services/testImportService');
const { asyncHandler } = require('../middlewares/errorHandler');

class ManagementController {
  listUsers = asyncHandler(async (req, res) => {
    const users = await managementService.listUsers(req.query.rol);
    res.status(200).json({ success: true, data: users });
  });

  createUser = asyncHandler(async (req, res) => {
    const user = await managementService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  });

  updateUser = asyncHandler(async (req, res) => {
    const user = await managementService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
  });

  deactivateUser = asyncHandler(async (req, res) => {
    const user = await managementService.deactivateUser(req.params.id);
    res.status(200).json({ success: true, data: user });
  });

  listFichas = asyncHandler(async (_req, res) => {
    const fichas = await managementService.listFichas();
    res.status(200).json({ success: true, data: fichas });
  });

  createFicha = asyncHandler(async (req, res) => {
    const ficha = await managementService.createFicha(req.body);
    res.status(201).json({ success: true, data: ficha });
  });

  updateFicha = asyncHandler(async (req, res) => {
    const ficha = await managementService.updateFicha(req.params.id, req.body);
    res.status(200).json({ success: true, data: ficha });
  });

  deactivateFicha = asyncHandler(async (req, res) => {
    const ficha = await managementService.deactivateFicha(req.params.id);
    res.status(200).json({ success: true, data: ficha });
  });

  createNovedad = asyncHandler(async (req, res) => {
    const novedad = await managementService.addNovedad(
      req.params.fichaId,
      req.user,
      req.body
    );
    res.status(201).json({ success: true, data: novedad });
  });

  learnerSchedule = asyncHandler(async (req, res) => {
    const fichas = await managementService.getLearnerSchedule(req.user._id);
    res.status(200).json({ success: true, data: fichas });
  });

  instructorFichas = asyncHandler(async (req, res) => {
    const fichas = await managementService.getInstructorFichas(req.user._id);
    res.status(200).json({ success: true, data: fichas });
  });

  previewTestImport = asyncHandler(async (req, res) => {
    const preview = await testImportService.preview(req.body);
    res.status(200).json({ success: true, data: preview });
  });

  confirmTestImport = asyncHandler(async (req, res) => {
    const result = await testImportService.confirm(req.body, req.user._id);
    res.status(201).json({ success: true, data: result });
  });
}

module.exports = new ManagementController();

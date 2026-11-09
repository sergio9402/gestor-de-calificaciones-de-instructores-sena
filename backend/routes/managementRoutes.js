const express = require('express');
const managementController = require('../controllers/managementController');
const { authorize, protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/users', authorize('coordinador'), managementController.listUsers);
router.post('/users', authorize('coordinador'), managementController.createUser);
router.patch('/users/:id', authorize('coordinador'), managementController.updateUser);
router.delete('/users/:id', authorize('coordinador'), managementController.deactivateUser);

router.get('/fichas', authorize('coordinador'), managementController.listFichas);
router.post('/fichas', authorize('coordinador'), managementController.createFicha);
router.patch('/fichas/:id', authorize('coordinador'), managementController.updateFicha);
router.delete('/fichas/:id', authorize('coordinador'), managementController.deactivateFicha);
router.post('/test-imports/preview', authorize('coordinador'), managementController.previewTestImport);
router.post('/test-imports/confirm', authorize('coordinador'), managementController.confirmTestImport);
router.post(
  '/fichas/:fichaId/novedades',
  authorize('coordinador', 'instructor'),
  managementController.createNovedad
);

router.get('/learner/schedule', authorize('aprendiz'), managementController.learnerSchedule);
router.get('/instructor/fichas', authorize('instructor'), managementController.instructorFichas);

module.exports = router;

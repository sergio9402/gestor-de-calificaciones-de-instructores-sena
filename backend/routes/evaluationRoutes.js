const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Mapeo de rutas para evaluaciones anónimas
router.post(
  '/',
  protect,
  authorize('aprendiz'),
  evaluationController.createEvaluation
);
router.get(
  '/recent',
  protect,
  authorize('coordinador'),
  evaluationController.getRecentEvaluations
);
router.get(
  '/instructor/:instructorId',
  protect,
  authorize('coordinador', 'instructor'),
  evaluationController.getInstructorEvaluations
);

module.exports = router;

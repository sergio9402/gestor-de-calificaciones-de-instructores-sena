const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Mapeo de rutas para instructores
router.get('/', instructorController.getInstructors);
router.get(
  '/metrics/summary',
  protect,
  authorize('coordinador'),
  instructorController.getMetricsSummary
);
router.get(
  '/:id',
  protect,
  authorize('coordinador', 'instructor'),
  instructorController.getInstructorById
);
router.patch(
  '/:id/status',
  protect,
  authorize('coordinador', 'instructor'),
  instructorController.updateOperationalStatus
);

module.exports = router;

const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');

// Mapeo de rutas para instructores
router.get('/', instructorController.getInstructors);
router.get('/metrics/summary', instructorController.getMetricsSummary);
router.get('/:id', instructorController.getInstructorById);
router.patch('/:id/status', instructorController.updateOperationalStatus);

module.exports = router;


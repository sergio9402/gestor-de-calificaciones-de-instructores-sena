const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

// Mapeo de rutas para evaluaciones anónimas
router.post('/', evaluationController.createEvaluation);
router.get('/recent', evaluationController.getRecentEvaluations);
router.get('/instructor/:instructorId', evaluationController.getInstructorEvaluations);

module.exports = router;


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Mapeo de rutas de autenticación
router.post('/login', authController.login);
router.get('/me/:id', authController.getProfile);

module.exports = router;


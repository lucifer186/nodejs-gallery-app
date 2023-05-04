const express = require('express');

const authController = require('../controllers/login');

const router = express.Router();

router.post('/login',authController.postlogin)
router.post('/logout',authController.postlogout)
router.get('/login',authController.getlogin)

module.exports = router;

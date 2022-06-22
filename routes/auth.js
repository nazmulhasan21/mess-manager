//const { body } = require('express-validator');

// require validator

const { userinputvalidat } = require('../middleware/inputvalidation');

const router = require('express').Router();

// require models

// require controllers
const authControllers = require('../controllers/auth');

// create routers
router.post('/signup', userinputvalidat, authControllers.signup);
router.post('/:id/verify/:token', authControllers.emailVerify);
router.post('/login', authControllers.login);

module.exports = router;

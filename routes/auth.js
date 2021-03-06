//const { body } = require('express-validator');

// require validator

const { signupInputValidat } = require('../middleware/inputValidation');

const router = require('express').Router();

// require models

// require controllers
const authControllers = require('../controllers/auth');

// create routers
router.post('/signup', signupInputValidat, authControllers.signup);
router.post('/:id/verify/:token', authControllers.emailVerify);
router.post('/login', authControllers.login);

module.exports = router;

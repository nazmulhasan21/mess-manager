const multer = require('multer');

//const { body } = require('express-validator');

// require validator

// const {userinputvalidat} = require('../middleware/inputvalidation');

const router = require('express').Router();

// require models

// require controllers
const userControllers = require('../controllers/user');

// require middleware
const isAuth = require('../middleware/is-auth');
const { image } = require('../middleware/image_upload');
const isAdmin = require('../middleware/is-admin');

// create routers
router.get('/me', isAuth, userControllers.me);
router.get('/:id', isAuth, userControllers.getUser);
router.put('/me', isAuth, userControllers.updateInfo);
router.put(
  '/me/avater',
  isAuth,
  image.single('avater'),
  userControllers.updateAvater
);
router.get('/name', userControllers.getName);

// router.post('/login', authControllers.login);

module.exports = router;

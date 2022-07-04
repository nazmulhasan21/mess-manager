const { body } = require('express-validator');

const User = require('../models/user');

exports.signupInputValidat = [
  body('email')
    .isEmail()
    .withMessage((value) => {
      return `'${value}' not a valid email.`;
    })
    .notEmpty()
    .withMessage('Plese enter any valid email.')
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject('E-Mail address already exists!');
        }
      });
    })
    .normalizeEmail(),
  body('phone')
    .isMobilePhone('bn-BD')
    .withMessage((value) => {
      return `'${value}' not a valid phone Number.`;
    })
    .notEmpty()
    .withMessage('Plese write any valid phone Number.')
    .custom((value, { req }) => {
      return User.findOne({ phone: value }).then((userDoc) => {
        if (userDoc) {
          return Promise.reject('Phone number already exists!');
        }
      });
    }),

  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('password  min length 8.'),
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Plese name min length 3.'),
  body('role')
    .trim()
    .isIn(['border', 'manager'])
    .withMessage("Plese select right role In 'border or manager' own.")
    .notEmpty()
    .withMessage('Plese select any one is your role.'),
];

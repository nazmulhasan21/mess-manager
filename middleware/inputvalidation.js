const { body } = require('express-validator');

const User = require('../models/user');

exports.userinputvalidat = [
    body('email').isEmail().withMessage('Please enter a valid email.')
    .custom((value,{req}) =>{
        return User.findOne({email:value}).then(userDoc =>{
            if(userDoc){
                return Promise.reject('E-Mail address already exists!');
            }
        });
    })
    .normalizeEmail(),
    body('phone').isMobilePhone().withMessage('Plese enter a valid phone Number')
    .custom((value,{req}) =>{
        return User.findOne({phone:value}).then(userDoc =>{
            if(userDoc){
                return Promise.reject('Phone number already exists!');
            }
        });
    })
    
    ,
    body('password').trim().isLength({min: 8}).withMessage('password  min length 8.'),
    body('name').trim().isLength({min: 3}).withMessage('Plese name min length 3.'),
]
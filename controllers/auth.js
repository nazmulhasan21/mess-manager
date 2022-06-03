
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');



const User = require('../models/user');


//signup user

exports.signup = async(req, res, next) =>{

    
    try{
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            const error = new Error('validation failed.');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        const userData = req.body;
        const hashPassword = await bcrypt.hash(userData.password, 12);

        const user = new User({
            ...userData,
            password:hashPassword
        });
        console.log(user);
        const result = await user.save();
        res.status(201).json({message:'User created!', userId:result._id});

    }catch(err){
        console.log(err);
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };
};

// end signup user


// login user

exports.login = async(req, res, next) =>{

    try{

        const userData = req.body;
        const user = await User.findOne({email:userData.email});
        if(!user){
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 401;
            throw error;
        }
        const isEqual = await bcrypt.compare(userData.password, user.password );

        if(!isEqual){
            const error = new Error('Wrong password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({
                 email:user.email,userId:user._id.toString()
            },
            process.env.PRIVATEKEY,
            {expiresIn:'2h'}

        );

        res.status(200).json({token:token, userId:user._id.toString()});

    }catch(err){
        console.log(err);
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    };
};

// end  login user


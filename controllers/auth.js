const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Token = require('../models/token');
const sendEmail = require('../utils/sendEmail');

//signup user

const handleError = (erros) => {
  const arrObj = {};
  erros.forEach((error) => {
    arrObj[error.param] = error.msg;
  });
  return arrObj;
};

exports.signup = async (req, res, next) => {
  // console.log(req.body);
  try {
    const errors = validationResult(req);
    // return;
    if (!errors.isEmpty()) {
      console.log(errors);
      const error = new Error('validation failed.');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const userData = req.body;
    const hashPassword = await bcrypt.hash(userData.password, 12);

    const user = await new User({
      ...userData,
      password: hashPassword,
    }).save();
    console.log(user);

    // create email Verified token

    // const token = await new Token({
    //   userId: user._id,
    //   token: crypto.randomBytes(32).toString('hex'),
    // }).save();
    // // url: req.protocol +
    // //   '://' +
    // //   req.headers.host +
    // //   req.originalUrl +
    // //   '/' +
    // //   result._id;
    // const url = `${req.protocol}://${req.headers.host}/auth/${user._id}/verify/${token.token}`;
    // console.log(url);
    // await sendEmail(user.email, 'Verify Email', url);
    res.status(201).json({ message: 'User create successefully' });
  } catch (err) {
    // console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    err.customErr = handleError(err.data);
    next(err);
  }
};

// end signup user

// get email verify token and verified user

exports.emailVerify = async (req, res, next) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user) {
      const error = new Error('Invalid link.');
      error.statusCode = 400;
      throw error;
    }
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) {
      const error = new Error('Invalid token.');
      error.statusCode = 400;
      throw error;
    }
    await User.updateOne({ _id: user._id, emailVerify: true });
    await token.remove();
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// login user

exports.login = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await User.findOne({ email: userData.email });
    if (!user) {
      // const error = new Error('A user with this email could not be found.');
      // error.statusCode = 401;
      // error.path = 'email';
      throw {
        statusCode: 401,
        errors: {
          login: 'A user with this email could not be found.',
        },
      };
    }

    // if (!user.emailVerify) {
    //   let token = await Token.findOne({ userId: user._id });
    //   if (!token) {
    //     token = await new Token({
    //       userId: user._id,
    //       token: crypto.randomBytes(32).toString('hex'),
    //     }).save();
    //     const url = `${req.protocol}://${req.headers.host}/auth/${user._id}/verify/${token.token}`;
    //     console.log(url);
    //     await sendEmail(user.email, 'Verify Email', url);
    //   }
    //   return res
    //     .status(403)
    //     .json({ message: 'An Email send to your account please verify' });
    // }

    const isEqual = await bcrypt.compare(userData.password, user.password);

    if (!isEqual) {
      throw {
        statusCode: 401,
        errors: {
          login: 'Wrong password.',
        },
      };
    }
    let token;
    if (user.messId) {
      token = jwt.sign(
        {
          email: user.email,
          role: user.role,
          userId: user._id.toString(),
          messId: user.messId.toString(),
        },
        process.env.PRIVATEKEY
        //,
        //  {expiresIn:'2h'}
      );
    } else {
      token = jwt.sign(
        {
          email: user.email,
          role: user.role,
          userId: user._id.toString(),
        },
        process.env.PRIVATEKEY
        //,
        //  {expiresIn:'2h'}
      );
    }
    res.status(200).json({
      message: 'User login successfully',
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    err.customErr = err.errors;
    next(err);
  }
};

// end  login user

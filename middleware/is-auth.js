const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    throw {
      statusCode: 401,
      errors: {
        authHeader: 'Not authenticated.',
      },
    };
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.PRIVATEKEY);
    if (!decodedToken) {
      throw {
        statusCode: 401,
        errors: {
          decodedToken: 'Not authenticated.',
        },
      };
    }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  req.userId = decodedToken.userId;
  req.userRole = decodedToken.role;
  //  req.userMessId = decodedToken.messId;

  next();
};

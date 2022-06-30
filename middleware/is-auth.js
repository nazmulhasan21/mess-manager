const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.PRIVATEKEY);
  } catch (err) {
    console.log(err);
    const message = 'Not authenticated.';

    if (!err.statusCode) {
      err.statusCode = 401;
      err.message = message;
    }

    throw err;
  }

  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;
  req.userRole = decodedToken.role;
  req.userMessId = decodedToken.messId;

  next();
};

const User = require('../models/user');

const getUser = async (userId) => {
  try {
    return User.findById({ _id: userId }).select('messId');
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
  }
};

module.exports = getUser;

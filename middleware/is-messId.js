const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById({ _id: userId });
    let messId = user.messId || false;
    const data = {
      month: {},
    };
    if (!messId) {
      return res.status(200).json({
        message: 'You not join any Mess.',
        data,
      });
    }

    req.messId = user.messId.toString();
    next();
    // console.log(mess._id.toString());
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

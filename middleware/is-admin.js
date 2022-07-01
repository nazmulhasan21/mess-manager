const Mess = require('../models/mass');

module.exports = async (req, res, next) => {
  try {
    const userId = req.userId;

    //const mess = await Mess.findOne({admin:userId});
    const mess = await Mess.findOne({
      $and: [{ admin: userId }, { managerId: userId }],
    });

    if (!mess) {
      throw {
        statusCode: 401,
        errors: {
          mess: 'This user not admin or manager',
        },
      };
    }

    req.messId = mess._id.toString();
    req.messName = mess.messName;
    req.admin = userId;
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

const Mess = require('../models/mass');
const Month = require('../models/month');
const User = require('../models/user');
const moment = require('moment');

exports.createMess = async (req, res, next) => {
  //  console.log(req.body.messName);

  try {
    const messName = req.body.messName;
    const userId = req.userId;
    const userRole = req.userRole;
    const user = await User.findById({ _id: userId });

    if (userRole !== 'manager') {
      throw {
        statusCode: 400,
        errors: {
          role: 'This User not Mess manager',
        },
      };
    }

    const oldMess = await Mess.findOne({
      $or: [{ admin: userId }, { managerId: userId }],
    });
    // console.log(oldMess);
    if (oldMess) {
      throw {
        statusCode: 400,
        errors: {
          createMess: 'All ready exit your Mess',
        },
      };
    }

    const mess = new Mess({
      messName,
      allMember: [req.userId],
      managerId: req.userId,
      admin: req.userId,
    });

    // console.log(mess);
    const createMess = await mess.save();

    const messId = createMess._id;
    const monthTitel = moment().format('MMMM YYYY');
    const managerId = req.userId;
    const allMember = [req.userId];

    const month = new Month({
      messId,
      messName,
      monthTitel,
      managerId,
      allMember,
    });
    //  console.log(month);
    const createMonth = await month.save();

    const updateMess = await Mess.findById(messId);
    updateMess.month.push(month);
    const result = await updateMess.save();
    user.messId = updateMess._id;
    await user.save();

    //
    res
      .status(201)
      .json({
        message: 'Create your mass successful..',
        mess: result,
        createMonth,
      });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMess = async (req, res, next) => {
  try {
    const messId = req.messId;

    const mess = await Mess.findById({ _id: messId })
      .populate('month')
      .populate('managerId', 'name')
      .populate('allMember');
    if (!mess) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'Mess not found.',
        },
      };
    }

    //
    res.status(201).json({ message: 'Get your mass.', mess });
  } catch (err) {
    //  console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  // console.log(req.body);

  try {
    const email = req.body.email;
    // find user in existing user
    const user = await User.findOne({ email: email });
    if (!user) {
      throw {
        statusCode: 404,
        errors: {
          user: 'No Member found with this email!',
        },
      };
    }
    // console.log(user._id);
    // find this user is mess member on other mess
    const isMessMember = await Mess.findOne({ allMember: user._id.toString() });

    // console.log(isMessMember);

    if (isMessMember !== null) {
      throw {
        statusCode: 400,
        errors: {
          isMessMember: 'This User is all ready add on other mess',
        },
      };
    }

    // add member is my mess

    const mess = await Mess.findById({ _id: req.messId });
    if (!mess) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'mess not found.',
        },
      };
    }

    mess.allMember.push(user);
    mess.totalBorder = mess.allMember.length;
    user.messId = mess._id;
    await mess.save();
    await user.save();

    //  console.log(mess.totalBorder);
    //   console.log(result);

    // send respose
    res.status(201).json({ message: 'Add member on your mess successful.' });
  } catch (err) {
    // console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.allMember = async (req, res, next) => {
  try {
    const messId = req.messId;
    const mess = await Mess.findById({ _id: messId })
      .select('messName')
      .populate('allMember', 'name');
    if (!mess) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'No Mess found',
        },
      };
    }
    const allMember = mess.allMember;

    if (!allMember) {
      return res.status(200).json({
        message: 'No member found.',
        allMember: {},
      });
    }

    //  console.log(allMember);

    res.status(200).json({
      message: 'All member show on your mess successful.',
      allMember: allMember,
    });
  } catch (err) {
    // console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteMember = async (req, res, next) => {
  // console.log(req.body);

  try {
    const userId = req.body.userId;
    // find user in existing user
    const isMessMember = await Mess.findOne({ allMember: userId });
    if (!isMessMember) {
      throw {
        statusCode: 400,
        errors: {
          isMessMember: 'This user no this mess member',
        },
      };
    }
    // Delete member is my mess
    await isMessMember.allMember.pull(userId);
    isMessMember.totalBorder = isMessMember.allMember.length;
    const result = await isMessMember.save();

    // send respose
    res
      .status(201)
      .json({ message: 'Delete member on your mess successful.', result });
  } catch (err) {
    //   console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

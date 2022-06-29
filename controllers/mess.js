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
      const error = new Error('This User not Mess manager');
      error.statusCode = 400;
      throw error;
    }

    const oldMess = await Mess.findOne({
      $or: [{ admin: userId }, { managerName: userId }],
    });
    // console.log(oldMess);
    if (oldMess) {
      const error = new Error('All ready exit your Mess');
      error.statusCode = 400;
      throw error;
    }

    const mess = new Mess({
      messName,
      allMember: [req.userId],
      managerName: req.userId,
      admin: req.userId,
    });

    console.log(mess);
    const createMess = await mess.save();

    const messId = createMess._id;
    const monthTitel = moment().format('MMMM YYYY');
    const managerName = req.userId;
    const allMember = [req.userId];

    const month = new Month({
      messId,
      messName,
      monthTitel,
      managerName,
      allMember,
    });
    console.log(month);
    const createMonth = await month.save();

    const updateMess = await Mess.findById(messId);
    updateMess.month.push(month);
    const result = await updateMess.save();
    user.messId = updateMess._id;
    await user.save();

    //
    res
      .status(201)
      .json({ message: 'Create your mass Fully.', mess: result, createMonth });
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
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    const mess = await Mess.findById({ _id: req.userMessId })
      .populate('month')
      .populate('managerName', 'name')
      .populate('allMember', 'depositAmount');

    //
    res.status(201).json({ message: 'Get your mass.', mess });
  } catch (err) {
    console.log(err);
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
      const error = new Error('No Member found with this email!');
      error.statusCode = 400;
      throw error;
    }
    // console.log(user._id);
    // find this user is mess member on other mess
    const isMessMember = await Mess.findOne({ allMember: user._id.toString() });
    console.log(isMessMember);

    if (isMessMember !== null) {
      const error = new Error('This User is all ready add on other mess');
      error.statusCode = 400;
      throw error;
    }

    // add member is my mess

    const mess = await Mess.findById({ _id: req.messId });

    mess.allMember.push(user);
    mess.totalBorder = mess.allMember.length;
    user.messId = mess._id;
    const result = await mess.save();
    await user.save();

    console.log(mess.totalBorder);
    //   console.log(result);

    // send respose
    res
      .status(201)
      .json({ message: 'Add member on your mess successful.', result });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.allMember = async (req, res, next) => {
  try {
    if (!req.messId) {
      res.status(404).json({
        message: 'You do not join any Mess.',
      });
      return;
    }

    const mess = await Mess.findById({ _id: req.messId })
      .select('messName')
      .populate('allMember', 'name');
    if (!mess) {
      const error = new Error('No Mess found');
      error.statusCode = 404;
      throw error;
    }
    if (!mess.allMember) {
      const error = new Error('Border not found');
      error.statusCode = 404;
      throw error;
    }
    const allMember = mess.allMember;
    console.log(allMember);

    res.status(200).json({
      message: 'All member show on your mess successful.',
      allMember: allMember,
    });
  } catch (err) {
    console.log(err);
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
      const error = new Error('This user no this mess member');
      error.statusCode = 400;
      throw error;
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
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

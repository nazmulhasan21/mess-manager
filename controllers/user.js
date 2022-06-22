const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const User = require('../models/user');
const Month = require('../models/month');
const Mess = require('../models/mass');
const moment = require('moment');
//const moment = require('moment');

exports.me = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await User.findById({ _id: userId }).select('-password');
    if (user.messId) {
      const mess = await Mess.findById({ _id: user.messId }).populate('month');

      const activeMonth = mess.month.length - 1;
      const month = mess.month[activeMonth];
      console.log(month.mealRate);
      user.mealCost = (month.mealRate * user.totalMeal).toFixed(2);
      user.otherCost = month.otherCostPerPerson;
      user.totalCost = (user.mealCost + user.otherCost).toFixed(2);

      user.balance = (user.totalDeposit - user.totalCost).toFixed(2);

      await user.save();
      res.status(200).json({ message: 'User foun successful.', user });
      return;
    } else {
      res.status(200).json({ message: 'User foun successful.', user });
    }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getName = async (req, res, next) => {
  try {
    console.log(req.params);
    return;
    // const m = moment();
    // console.log(m.daysInMonth());
    // //  console.log(activeDate);
    // // const messId = req.messId;
    // const user = await User.findById({ _id: req.userId });
    // //console.log(user.createdAt);
    // const createdAt = moment(user.createdAt);
    // const userCreateTime = m.diff(createdAt, 'days');
    // let userLastupdateTime = moment(user.updatedAt);

    // let userUpdateTime = m.diff(userLastupdateTime, 'days');
    // // console.log(req.hostname);
    // // updatedAt
    res.send({ userCreateTime, userUpdateTime });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateInfo = async (req, res, next) => {
  try {
    // if(!req.file){
    //     const error = new Error('No image provided');
    //     error.statusCode = 422;
    //     throw error;
    // }

    const { name, institution, address } = req.body;

    const user = await User.findById({ _id: req.userId });
    user.name = name;
    user.institution = institution;
    user.address = address;
    const updateUser = await user.save();

    console.log(updateUser);

    res.status(200).json({ message: 'User update successful.', user });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateAvater = async (req, res, next) => {
  // console.log(req);

  try {
    if (!req.file) {
      const error = new Error('No image provided');
      error.statusCode = 422;
      throw error;
    }
    const avater = req.file.destination + '/' + req.file.filename;

    const user = await User.findById({ _id: req.userId });
    if (!user) {
      const error = new Error('Could not find user.');
      error.statusCode = 404;
      throw error;
    }

    // delete old avater
    if (
      avater !== user.avater &&
      user.avater !== '/images/mess_manager_profile_vector-01.png'
    ) {
      clearImage(user.avater);
    }
    // set new avater
    user.avater = avater;

    const updateUser = await user.save();

    // send res

    res
      .status(200)
      .json({ message: 'User avater successful.', avater: updateUser.avater });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err) =>
    console.log({ err, unlink: 'image delete successful.' })
  );
};

const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const Month = require('../models/month');
const Mess = require('../models/mass');
const User = require('../models/user');
const { detectExtension } = require('nodemailer/lib/mime-funcs/mime-types');

exports.createMonth = async (req, res, next) => {
  //  console.log(req.messId);

  try {
    const activeDate = moment().format('MMMM YYYY');
    const messId = req.messId;
    const messName = req.messName;
    const monthTitel = moment().format('MMMM YYYY');
    const managerName = req.userId;
    const allMember = [req.userId];
    const activeMonth = await Month.findOne({
      $and: [
        { messId: messId },
        { monthTitel: { $regex: activeDate, $options: 'i' } },
      ],
    });
    // const oldMonth = await Month.findOne({ $and: [{messId:messId }, { monthTitel: }]});
    if (activeMonth) {
      const error = new Error(
        `All ready exit this ${moment().format('MMMM YYYY')} Month manager!`
      );
      error.statusCode = 400;
      throw error;
    }
    const month = new Month({
      messId,
      messName,
      monthTitel,
      managerName,
      allMember,
    });

    console.log(month);
    const createMonth = await month.save();
    const mess = await Mess.findById(req.messId);
    mess.month.push(month);
    const updateMess = await mess.save();

    res
      .status(201)
      .json({ message: 'Create your mass Fully.', createMonth, updateMess });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMonth = async (req, res, next) => {
  try {
    const activeDate = moment().format('MMMM YYYY');
    const mess = await Mess.findById(req.userMessId)
      .populate('allMember', 'totalMeal totalDeposit totalDepostiRich')
      .select('totalMeal totalDeposit totalBorder totalDepostiRich');

    if (!mess) {
      res.status(404).json({
        message: 'You do not Join any mess.',
      });
      return;
    }

    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: activeDate }],
    });

    if (!month) {
      res.status(404).json({
        message: 'You have not a active month in this movement.',
        month,
      });
      return;
    }

    let cost = month.cost;

    month.totalMeal = _.sumBy(mess.allMember, 'totalMeal') || 1;
    month.totalDeposit = _.sumBy(mess.allMember, 'totalDeposit');
    month.totalRich = _.sumBy(mess.allMember, 'totalDepostiRich');

    const bigCost = _.filter(cost, { type: 'bigCost' });
    const totalbigCost = _.sumBy(bigCost, 'amount');

    const smallCost = _.filter(cost, { type: 'smallCost' });
    const totalsmallCost = _.sumBy(smallCost, 'amount');

    const otherCost = _.filter(cost, { type: 'otherCost' });
    month.totalotherCost = _.sumBy(otherCost, 'amount');

    const totalMealCost = totalbigCost + totalsmallCost;
    month.mealRate = (totalMealCost / month.totalMeal).toFixed(2);

    month.otherCostPerPerson = (
      month.totalotherCost / mess.totalBorder
    ).toFixed(2);

    month.totalCost = totalMealCost + month.totalotherCost;
    month.balance = month.totalDeposit - month.totalCost;

    // save in month database
    await month.save();
    // res.status(200).json({
    //   mess,
    //   message: 'getMonth.',
    //   month,
    // });

    // } else {
    // send respose
    res.status(200).json({
      message: 'getMonth.',
      month,
    });
    // }
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOldMonth = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    const activeDate = moment().subtract(1, 'months');
    const oldMonth = activeDate.format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: oldMonth }],
    });
    if (!month) {
      const error = new Error('Old Month are not aviable!');
      error.statusCode = 400;
      throw error;
    }

    // send respose
    res.status(200).json({ message: 'getMonth.', month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllMonth = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    const messId = req.userMessId;
    const messIdFilter = messId ? { messId } : {};
    const monthTitel = req.query.monthTitel || '';
    // const activeDate = moment().subtract(1, 'months');
    const monthFilter = monthTitel
      ? { monthTitel: { $regex: monthTitel, $options: 'i' } }
      : {};
    // const oldMonth = activeDate.format('MMMM YYYY');

    const month = await Month.find({ ...monthFilter, ...messIdFilter });
    if (!month) {
      const error = new Error(`Not have a ${monthTitel} this Month`);
      error.statusCode = 404;
      throw error;
    }
    let message = 'Get Your Mess Months';
    if (month == false) {
      message = 'Not found Your Mess Month';
      res.status(200).json({ message });
      return;
    }

    // send respose
    res.status(200).json({ message, month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.changeManager = async (req, res, next) => {
  try {
    const userId = req.body.userId;
    const isMessMember = await Mess.findOne({ allMember: userId });
    if (!isMessMember) {
      const error = new Error('This user not this mess  Member!');
      error.statusCode = 400;
      throw error;
    }
    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { managerName: req.userId }],
    });
    month.managerName = userId;
    const user = await User.findById({ _id: userId });
    user.role = 'manager';
    await user.save();
    const oldManager = await User.findById({ _id: req.userId });
    oldManager.role = 'border';
    await oldManager.save();
    const mess = await Mess.findById({ _id: req.messId });
    mess.managerName = userId;
    await mess.save();
    await month.save();

    // send respose
    res.status(200).json({ message: 'Change Manager.', month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// not add this constrollers fountion on my month router
exports.addMonthMember = async (req, res, next) => {
  // console.log(req.body);

  try {
    const user = req.body.user;
    // add member is my Month
    const month = await Month.findById({
      $and: [{ messId: req.messId }, { managerId: req.userId }],
    });

    month.allMember.push(user);
    //mess.totalBorder = mess.allMember.length;
    const result = await month.save();

    //   console.log(result);

    // send respose
    res
      .status(201)
      .json({ message: 'Add member on your month successful.', result });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
// end this contorller

exports.addMemberMoney = async (req, res, next) => {
  // console.log(req.body);

  try {
    const depositAmount = req.body.depositAmount;
    const userId = req.body.userId;
    const depositDate = new Date();
    // find user in existing user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      const error = new Error('No Member found with this email!');
      error.statusCode = 400;
      throw error;
    }
    const deposit = {
      amount: depositAmount,
      depositDate: depositDate,
    };

    user.depositAmount.push(deposit);
    user.totalDeposit = _.sumBy(user.depositAmount, 'amount');

    await user.save();
    const month = await Month.findOne({ messId: req.messId });
    month.totalDeposit += depositAmount;
    await month.save();

    // send respose
    res.status(201).json({ message: 'Add money.', user });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addMemberRich = async (req, res, next) => {
  // console.log(req.body);

  try {
    const depositRich = req.body.depositRich;
    const userId = req.body.userId;
    const depositDate = new Date();
    // find user in existing user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      const error = new Error('No Member found with this email!');
      error.statusCode = 400;
      throw error;
    }

    const deposit = {
      amount: depositRich,
      depositDate: depositDate,
    };
    user.depositRich.push(deposit);
    user.totalDepostiRich = _.sumBy(user.depositRich, 'amount');
    await user.save();
    const month = await Month.findOne({ messId: req.messId });
    month.totalRich += depositRich;
    await month.save();

    // send respose
    res.status(201).json({ message: 'Add Rich.', user, month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addMarketCost = async (req, res, next) => {
  try {
    const type = req.body.type;
    const titel = req.body.titel;
    const amount = req.body.amount;
    const purchasedate = new Date();
    const month = await Month.findOne({ managerName: req.userId });
    if (!month) {
      const error = new Error('Month not found!');
      error.statusCode = 404;
      throw error;
    }
    // add Big Market Cost

    const cost = {
      type: type,
      titel: titel,
      amount: amount,
      purchasedate: purchasedate,
    };
    // if (type === 'bigCost') {
    //   month.bigCost.push(cost);
    // } else if (type === 'smallCost') {
    //   month.smallCost.push(cost);
    // } else if (type === 'otherCost') {
    //   month.otherCost.push(cost);
    // }
    month.cost.push(cost);
    await month.save();
    const length = month.cost.length - 1;
    const recentCost = month.cost[length];

    console.log(recentCost);

    // send respose
    res.status(201).json({ message: 'Add Cost successfull.', recentCost });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.updateMarketCost = async (req, res, next) => {
  try {
    const type = req.body.type;
    const id = req.params.id;
    const titel = req.body.titel;
    const amount = req.body.amount;
    const purchasedate = new Date();

    const month = await Month.findOne({ managerName: req.userId });
    if (!month) {
      const error = new Error('Month not found!');
      error.statusCode = 404;
      throw error;
    }

    const cost = _.filter(
      month.cost,

      ['_id', new mongoose.Types.ObjectId(id)]
    );
    // add Big Market Cost
    // let cost;
    // if (type === 'bigCost') {
    //   const bigCost = month.bigCost;
    //   cost = _.filter(
    //     bigCost,

    //     ['_id', new mongoose.Types.ObjectId(id)]
    //   );
    // } else if (type === 'smallCost') {
    //   const smallCost = month.smallCost;
    //   cost = _.filter(
    //     smallCost,

    //     ['_id', new mongoose.Types.ObjectId(id)]
    //   );
    // } else if (type === 'otherCost') {
    //   const otherCost = month.otherCost;
    //   cost = _.filter(
    //     otherCost,

    //     ['_id', new mongoose.Types.ObjectId(id)]
    //   );
    //   console.log(cost);
    // }
    (cost[0].type = type),
      (cost[0].titel = titel),
      (cost[0].amount = amount),
      (cost[0].purchasedate = purchasedate);

    await month.save();

    // send respose
    res.status(201).json({ message: 'eidt cost.', cost });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMarketCost = async (req, res, next) => {
  try {
    costTypeObject = req.query.costType;
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }

    const mess = await Mess.findById({ _id: req.userMessId })
      // .populate('month', 'cost')
      .select('month');
    if (!mess) {
      res.status(404).json({ message: 'You not Join any Mess' });
      return;
    }
    const activeMonth = mess.month.length - 1;
    const _id = mess.month[activeMonth]._id;

    const month = await Month.findById(_id).select('cost');

    res.status(200).json(month);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.addDailyBorderMeal = async (req, res, next) => {
  try {
    console.log(req.body);
    return;

    const dailyMeal = {
      breakfast: req.body.breakfast,
      lunch: req.body.lunch,
      dinner: req.body.dinner,
    };

    const user = await User.findById(req.body.userId);
    user.dailyMeal.push(dailyMeal);

    await user.save();
    res.status(201).json({ message: 'Add dailyMeal successfully.' });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const Meal = require('../models/meal');
const Month = require('../models/month');
const Mess = require('../models/mass');
const User = require('../models/user');

const Puppeteer = require('puppeteer');

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
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }

    const activeDate = moment().format('MMMM YYYY');

    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: activeDate }],
    });

    if (!month) {
      const error = new Error('You have not a active month in this movement.');
      error.statusCode = 404;
      throw error;
    }

    const meal = await Meal.aggregate([
      {
        $match: {
          $and: [
            { messId: new mongoose.Types.ObjectId(req.userMessId) },
            { monthId: new mongoose.Types.ObjectId(month._id) },
          ],
        },
      },
      { $group: { _id: '$monthId', total: { $sum: '$total' } } },
    ]);

    // let cost = month.cost;

    month.totalMeal = meal[0]?.total || 0;
    month.mealRate = month.totalMealCost / month.totalMeal;

    // save in month database
    await month.save();
    const mess = await Mess.findById({ _id: month.messId })
      .populate('allMember', ' _id')
      .select('allMember _id');

    const userCalcultaion = async (userId) => {
      const user = await User.findById({ _id: userId });

      user.mealCost = (month.mealRate * user.totalMeal).toFixed(2);
      user.otherCost = month.otherCostPerPerson;
      user.totalCost = (user.mealCost + user.otherCost).toFixed(2);

      user.balance = (user.totalDeposit - user.totalCost).toFixed(2);

      await user.save();
    };
    mess.allMember.map((user) => {
      userCalcultaion(user._id);
    });

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

// money
exports.addMemberMoney = async (req, res, next) => {
  // console.log(req.body);

  try {
    const depositAmount = req.body.depositAmount;

    const userId = req.body.userId;
    const depositDate = new Date();
    // find user in existing user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      const error = new Error('No Member found !');
      error.statusCode = 400;
      throw error;
    }
    const deposit = {
      amount: depositAmount,
      depositDate: depositDate,
    };

    user.depositAmount.push(deposit);
    user.totalDeposit = _.sumBy(user.depositAmount, 'amount');
    user.balance = user.totalDeposit - user.totalCost;

    await user.save();
    const month = await Month.findOne({ messId: req.messId });
    month.totalDeposit += depositAmount;
    month.balance = month.totalDeposit - month.totalCost;
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
exports.listMemberMoney = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }

    const mess = await Mess.findById({ _id: req.userMessId })
      .populate('allMember', 'depositAmount')
      .select('allMember depositAmount');

    if (!mess) {
      const error = new Error('mess not found !');
      error.statusCode = 404;
      throw error;
    }
    const user = mess.allMember;

    res.status(200).json({ message: 'Get your mass member money list.', user });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.getMemberMoney = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const id = req.params.id;
    const user = await User.findById({ _id: userId }).select('depositAmount');

    if (!user) {
      const error = new Error('user not found !');
      error.statusCode = 404;
      throw error;
    }
    const depositAmount = _.filter(user.depositAmount, [
      '_id',
      new mongoose.Types.ObjectId(id),
    ]);

    const data = _.concat(depositAmount, { userId: userId });

    //
    res.status(201).json({ message: 'Get your mass.', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.updateMemberMoney = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const id = req.params.id;
    const amount = req.body.amount;
    const depositDate = req.body.depositAmount;
    const user = await User.findById({ _id: userId }).select('depositAmount');

    if (!user) {
      const error = new Error('user not found !');
      error.statusCode = 404;
      throw error;
    }
    const depositAmount = _.filter(user.depositAmount, [
      '_id',
      new mongoose.Types.ObjectId(id),
    ]);
    depositAmount[0].amount = amount;
    depositAmount[0].depositDate = depositDate;
    await user.save();

    //
    res.status(201).json({ message: 'Get your mass.', depositAmount });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
// end money

// Rich //
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

exports.updateMemberRich = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const id = req.params.id;
    const amount = req.body.amount;
    const depositDate = req.body.depositAmount;
    const user = await User.findById({ _id: userId }).select('depositRich');

    if (!user) {
      const error = new Error('user not found !');
      error.statusCode = 404;
      throw error;
    }
    const depositRich = _.filter(user.depositRich, [
      '_id',
      new mongoose.Types.ObjectId(id),
    ]);
    depositRich[0].amount = amount;
    depositRich[0].depositDate = depositDate;
    await user.save();

    //
    res.status(201).json({ message: 'Get your mass.', depositRich });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMemberRich = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const id = req.params.id;
    const user = await User.findById({ _id: userId }).select('depositRich');

    if (!user) {
      const error = new Error('user not found !');
      error.statusCode = 404;
      throw error;
    }
    const depositRich = _.filter(user.depositRich, [
      '_id',
      new mongoose.Types.ObjectId(id),
    ]);

    const data = _.concat(depositRich, { userId: userId });

    //
    res.status(201).json({ message: 'Get your mass.', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.listMemberRich = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }

    const mess = await Mess.findById({ _id: req.userMessId })
      .populate('allMember', 'depositRich')
      .select('allMember depositRich');

    if (!mess) {
      const error = new Error('mess not found !');
      error.statusCode = 404;
      throw error;
    }
    const user = mess.allMember;

    res.status(200).json({ message: 'Get your mass member Rich list.', user });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// end Rich

// cost

exports.addMarketCost = async (req, res, next) => {
  try {
    const type = req.body.type;
    const titel = req.body.titel;
    const amount = req.body.amount;
    const purchasedate = new Date();
    const month = await Month.findOne({ managerName: req.userId }).select(
      'cost totalCost balance totalDeposit'
    );
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

    month.cost.push(cost);

    calculation(month, req);

    await month.save();

    const length = month.cost.length - 1;
    const recentCost = month.cost[length];

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

    const month = await Month.findOne({ managerName: req.userId }).select(
      'cost totalCost totalDeposit balance'
    );
    if (!month) {
      const error = new Error('Month not found!');
      error.statusCode = 404;
      throw error;
    }

    const cost = _.filter(
      month.cost,

      ['_id', new mongoose.Types.ObjectId(id)]
    );

    (cost[0].type = type),
      (cost[0].titel = titel),
      (cost[0].amount = amount),
      (cost[0].purchasedate = purchasedate);

    calculation(month, req);

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

exports.deleteMarketCost = async (req, res, next) => {
  try {
    const id = req.params.id;

    const month = await Month.findOne({ managerName: req.userId }).select(
      'cost totalCost totalDeposit balance'
    );
    if (!month) {
      const error = new Error('Month not found!');
      error.statusCode = 404;
      throw error;
    }

    const cost = _.filter(
      month.cost,

      ['_id', new mongoose.Types.ObjectId(id)]
    );
    month.cost.pull(cost[0]);

    calculation(month, req);

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
    costTypeObject = req.query.cost;
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    // const query = req.query.cost.split(',');
    // const newarr = _.join(query, ' ');

    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: activeDate }],
    }).select('cost');

    res.status(200).json({ month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCost = async (req, res, next) => {
  try {
    const costId = req.params.id;
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }

    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: activeDate }],
    }).select('cost');

    const cost = _.filter(
      month.cost,

      ['_id', new mongoose.Types.ObjectId(costId)]
    );

    res.status(200).json(cost);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// end Cost

exports.addDailyBorderMeal = async (req, res, next) => {
  try {
    const dailyMealArray = req.body;
    const messId = req.messId;

    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { monthTitel: activeDate }],
    }).select('_id totalMeal');

    if (!month) {
      const error = new Error('Now have not  active Month.');
      error.statusCode = 404;
      throw error;
    }

    const monthId = month._id;

    const monthMeal = async (userId, dailyMeal) => {
      const newMeal = new Meal(dailyMeal);
      await newMeal.save();

      const meal = await Meal.aggregate([
        {
          $match: {
            $and: [
              { userId: new mongoose.Types.ObjectId(userId) },
              { monthId: new mongoose.Types.ObjectId(monthId) },
            ],
          },
        },
        { $group: { _id: '$monthId', total: { $sum: '$total' } } },
      ]);
      const user = await User.findById({ _id: userId }).select('totalMeal');

      //  console.log(month);
      user.totalMeal = meal[0]?.total || 0;
      await user.save();
    };

    dailyMealArray.map((meal) => {
      const userId = meal.userId;
      const total = meal.breakfast + meal.lunch + meal.dinner;
      const dailyMeal = {
        ...meal,
        total: total,
        messId,
        monthId,
      };

      monthMeal(userId, dailyMeal);
    });

    res.status(201).json({ message: 'Add dailyMeal successfully.', month });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.mealList = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.userMessId }, { monthTitel: activeDate }],
    }).select('_id');
    // some filter query

    // const date = new Date(`${req.query.date}`, 0, 0, 0).toISOString();
    // const dayfilter = date ? { date: { $eq: date } } : {};
    const userId = req.query.userId;
    const userfilter = userId ? { userId: req.userId } : {};
    const meal = await Meal.find({
      $and: [{ messId: req.userMessId }, { monthId: month._id }],
      //  ...dayfilter,
      ...userfilter,
    }).populate('userId', 'name');

    if (!meal) {
      const error = new Error('This Month have a no meal aviabel!');
      error.statusCode = 404;
      throw error;
    }

    //
    res
      .status(201)
      .json({ message: 'Get your member meal List.', month, meal });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateDailyMeal = async (req, res, next) => {
  try {
    // const userId = req.params.userId;
    const id = req.params.id;
    const { breakfast, lunch, dinner, date } = req.body;
    const total = breakfast + lunch + dinner;

    const meal = await Meal.findById({ _id: id });
    if (!meal) {
      const error = new Error('Meal not found !');
      error.statusCode = 404;
      throw error;
    }

    (meal.breakfast = breakfast),
      (meal.lunch = lunch),
      (meal.dinner = dinner),
      (meal.date = date),
      (meal.total = total);
    await meal.save();

    res.status(201).json({ message: 'update meal successfull.' });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getDailyMeal = async (req, res, next) => {
  try {
    // const userId = req.params.userId;
    const id = req.params.id;

    const meal = await Meal.findById({ _id: id });
    if (!meal) {
      const error = new Error('Meal not found !');
      error.statusCode = 404;
      throw error;
    }

    res.status(201).json({ message: 'get meal successfull.', meal });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMonthCalculation = async (req, res, next) => {
  try {
    const month = await Month.findOne({ _id: '62b6c580c2659da9b9145e63' });
    if (!month) {
      const error = new Error('month not found !');
      error.statusCode = 404;
      throw error;
    }

    const browser = await Puppeteer.launch();

    const page = await browser.newPage();
    await page.goto('/month/monthCalculation');
    await page.setContent('<h1> Hello world </h1>');

    // creat a pdf document

    await page.pdf({
      path: month.monthTitel + '.pdf',
      format: 'A4',
      printBackground: true,
    });

    console.log('Done create pdf');

    await browser.close();

    res.status(201).json({ message: 'get month successfull.', result });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.test = async (req, res, next) => {
  try {
    if (!req.userMessId) {
      const error = new Error('You not join any Mess.');
      error.statusCode = 404;
      throw error;
    }
    console.log(req.userId);
    const meal = await Meal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$date', total: { $sum: '$total' } } },
    ]);

    //  const meal = await Meal.find({ userId: req.userId });

    res.status(201).json({ message: 'Get your member meal List.', meal });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

///  calculation cost

const calculation = async (month, req) => {
  const mess = await Mess.findById(req.userMessId).select(' totalBorder ');
  const cost = month.cost;

  const bigCost = _.filter(cost, { type: 'bigCost' });
  const totalbigCost = _.sumBy(bigCost, 'amount');

  const smallCost = _.filter(cost, { type: 'smallCost' });
  const totalsmallCost = _.sumBy(smallCost, 'amount');

  const otherCost = _.filter(cost, { type: 'otherCost' });
  month.totalotherCost = _.sumBy(otherCost, 'amount');

  month.totalMealCost = totalbigCost + totalsmallCost;

  month.totalCost = _.sumBy(month.cost, 'amount');

  month.balance = month.totalDeposit - month.totalCost;

  month.otherCostPerPerson = (month.totalotherCost / mess.totalBorder).toFixed(
    2
  );
};

const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const Meal = require('../models/meal');
const Month = require('../models/month');
const Cost = require('../models/cost');
const Rich = require('../models/rich');
const Cash = require('../models/cash');
const Mess = require('../models/mass');
const User = require('../models/user');

const Puppeteer = require('puppeteer');
// const hbs = require('handlebars');
// const path = require('path');
// const fs = require('fs-extra');
// const data = require('../date.json');
const createPDF = require('../utils/createPDF');

// compile the hbs templete to pdf document

const compile = async function (templeteName, data) {
  const filePath = path.join(process.cwd(), 'templates', `${templeteName}.hbs`);

  // get the html
  //console.log(data);
  const html = await fs.readFile(filePath, 'utf8');
  return hbs.compile(html)(data.toObject());
};

exports.getMonthCalculation = async (req, res, next) => {
  try {
    const messId = '62c11ea530bfa0763e5f4c38';

    var mess = await Mess.findById({ _id: messId })
      .populate('month')
      .populate('allMember');
    if (!mess) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'Mess not found.',
        },
      };
    }
    var month = mess.month[mess.month.length - 1];
    const managerName = await User.findById(mess.managerId).select('name');
    // const cash = await Cash.aggregate([
    //   {
    //     $match: {
    //       $and: [
    //         { messId: new mongoose.Types.ObjectId(messId) },
    //         { monthId: new mongoose.Types.ObjectId(month._id) },
    //       ],
    //     },
    //   },
    //   { $group: { _id: ['$depositDate $userId'], total: { $sum: '$amount' } } },
    // ]);
    // console.log(cash);

    const data = _.merge(mess, month, managerName);

    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://youtube.com');
    await page.screenshot({ path: 'screenshot.png' });
    console.log('create screenshot');
    await browser.close();

    //  await createPDF('index', data);
    // const browser = await Puppeteer.launch({
    //   headless: true,
    //   ignoreDefaultArgs: ['--disable-extensions'],
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // });
    // const page = await browser.newPage();
    // const content = await compile('index', data);
    // await page.setContent(content);
    // await page.pdf({
    //   path: `${mess.month[mess.month.length - 1].monthTitel}.pdf`,
    //   format: 'A4',
    //   printBackground: true,
    // });

    // console.log('Done create pdf');

    // await browser.close();

    res.status(201).json({ message: 'get month successfull.', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createMonth = async (req, res, next) => {
  //  console.log(req.messId);

  try {
    const activeDate = moment().format('MMMM YYYY');
    const messId = req.messId;
    const messName = req.messName;
    const monthTitel = moment().format('MMMM YYYY');
    const managerId = req.userId;
    const allMember = [req.userId];

    const mess = await Mess.findById(req.messId);
    if (!mess) {
      throw {
        statusCode: 404,
        errors: {
          mess: ' Mess not found.',
        },
      };
    }

    const activeMonth = await Month.findOne({
      $and: [
        { messId: messId },
        { monthTitel: { $regex: activeDate, $options: 'i' } },
      ],
    });
    // const oldMonth = await Month.findOne({ $and: [{messId:messId }, { monthTitel: }]});
    if (activeMonth) {
      throw {
        statusCode: 400,
        errors: {
          activeMonth: `All r eady exit this ${moment().format(
            'MMMM YYYY'
          )} Month manager!`,
        },
      };
    }
    const month = new Month({
      messId,
      messName,
      monthTitel,
      managerId,
      allMember,
    });

    //console.log(month);
    const createMonth = await month.save();

    mess.month.push(month);
    const updateMess = await mess.save();

    res.status(201).json({
      message: 'Create your month  successful.',
      createMonth,
      updateMess,
    });
  } catch (err) {
    //  console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMonth = async (req, res, next) => {
  try {
    const messId = req.messId;
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: messId }, { monthTitel: activeDate }],
    });

    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'You have not a active month in this movement.',
        },
      };
    }

    const meal = await Meal.aggregate([
      {
        $match: {
          $and: [
            { messId: new mongoose.Types.ObjectId(messId) },
            { monthId: new mongoose.Types.ObjectId(month._id) },
          ],
        },
      },
      { $group: { _id: '$monthId', total: { $sum: '$total' } } },
    ]);

    // let cost = month.cost;
    month.totalMeal = meal.length === 0 ? 1 : meal[0].total;
    month.mealRate = (month.totalMealCost / month.totalMeal).toFixed(2);
    month.richBalance = month.totalRich - month.totalMeal;

    // save in month database
    await month.save();
    const mess = await Mess.findById({ _id: month.messId })
      .populate('allMember', ' _id totalMeal')
      .select('allMember _id totalMeal');

    const userCalcultaion = async (userId) => {
      const user = await User.findById({ _id: userId });
      user.richBalance = user.totalDepostiRich - user.totalMeal;
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
      message: 'getMonth successful..',
      month,
    });

    // }
  } catch (err) {
    //  console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOldMonth = async (req, res, next) => {
  try {
    const activeDate = moment().subtract(1, 'months');
    const oldMonth = activeDate.format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { monthTitel: oldMonth }],
    });
    if (!month) {
      throw {
        statusCode: 400,
        errors: {
          month: 'Old Month are not aviable!',
        },
      };
    }

    // send respose
    res.status(200).json({ message: 'getMonth.', month });
  } catch (err) {
    //  console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllMonth = async (req, res, next) => {
  try {
    const messId = req.messId;

    const messIdFilter = messId ? { messId } : {};
    const monthTitel = req.query.monthTitel || '';
    // const activeDate = moment().subtract(1, 'months');
    const monthFilter = monthTitel
      ? { monthTitel: { $regex: monthTitel, $options: 'i' } }
      : {};
    // const oldMonth = activeDate.format('MMMM YYYY');

    const month = await Month.find({ ...monthFilter, ...messIdFilter });
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: `Not have a ${monthTitel} this Month`,
        },
      };
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
    // console.log(err);
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
      throw {
        statusCode: 400,
        errors: {
          isMessMember: 'This user not this mess  Member!',
        },
      };
    }
    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { managerId: req.userId }],
    });
    month.managerName = userId;
    const user = await User.findById({ _id: userId });
    // set new month manager
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
    //  console.log(err);
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

// money ****
exports.addMemberMoney = async (req, res, next) => {
  // console.log(req.body);
  try {
    const depositAmount = req.body.depositAmount;
    const userId = req.body.userId;
    const depositDate = req.body.depositDate || new Date();

    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { managerId: req.userId }],
    });
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'month not found',
        },
      };
    }

    const cash = new Cash({
      messId: req.messId,
      monthId: month._id,
      userId: userId,
      amount: depositAmount,
      depositDate: depositDate,
    });

    const data = await cash.save();

    await cashCalcultion(month, userId);

    await month.save();

    // send respose
    res.status(201).json({ message: 'Add Cash successfully.', data });
  } catch (err) {
    // console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.listMemberMoney = async (req, res, next) => {
  try {
    const messId = req.messId;
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: messId }, { monthTitel: activeDate }],
    });
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }

    const cash = await cash
      .find({
        $and: [{ messId: messId }, { monthId: month._id }],
      })
      .populate('userId', 'name');

    if (!cash) {
      return res.status(201).json({ message: 'No cash list found.', data: {} });
    }
    res.status(201).json({ message: 'Get your mass.', data: cash });
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
    const _id = req.params.id;

    const cash = await Cash.findById(_id);
    if (!cash) {
      return res.status(200).json({ message: 'No cash found.', data: {} });
    }

    res.status(200).json({ message: 'Get your rich.', data: cash });
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
    const _id = req.params.id;
    const monthId = req.params.monthId;
    const depositAmount = req.body.depositAmount;
    const userId = req.body.userId;
    const depositDate = req.body.depositDate || new Date();
    const month = await Month.findById(monthId);

    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'month not found !',
        },
      };
    }

    const cash = await Cash.findById(_id);
    if (!cash) {
      throw {
        statusCode: 404,
        errors: {
          cash: 'Cash not found',
        },
      };
    }
    cash.amount = depositAmount;
    cash.depositDate = depositDate;
    cash.userId = userId;
    const data = await cash.save();

    await cashCalcultion(month, userId);

    await month.save();

    //
    res.status(200).json({ message: 'Update cash successfully.', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteMemberMoney = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const monthId = req.params.monthId;

    const month = await Month.findById(monthId);
    // .select(
    //   'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    // );
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }

    const cash = await cash.findById(_id);
    if (!cash) {
      throw {
        statusCode: 404,
        errors: {
          cash: 'allrady deleted!',
        },
      };
    }
    let userId = cash.userId;
    const data = await cash.findByIdAndDelete(_id);

    await cashCalcultion(month, userId);

    await month.save();

    // send respose
    res.status(201).json({ message: 'Delete cash  successfully..', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
// end money ****

// Rich ************ //
exports.addMemberRich = async (req, res, next) => {
  //console.log(req);

  try {
    const depositRich = req.body.depositRich;
    const userId = req.body.userId;
    const depositDate = req.body.depositDate || new Date();

    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { managerId: req.userId }],
    });
    if (!month) {
      throw {
        statusCode: 400,
        errors: {
          month: 'month not found',
        },
      };
    }

    const rich = new Rich({
      messId: req.messId,
      monthId: month._id,
      userId: userId,
      amount: depositRich,
      depositDate: depositDate,
    });

    const data = await rich.save();

    await richCalcultion(month, userId);

    await month.save();

    // send respose
    res.status(201).json({ message: 'Add Rich successfully.', data });
  } catch (err) {
    // console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateMemberRich = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const monthId = req.params.monthId;
    const depositRich = req.body.depositRich;
    const userId = req.body.userId;
    const depositDate = req.body.depositDate || new Date();
    const month = await Month.findById(monthId);

    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'month not found !',
        },
      };
    }

    const rich = await Rich.findById(_id);
    if (!rich) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'Rich not found',
        },
      };
    }
    rich.amount = depositRich;
    rich.depositDate = depositDate;
    rich.userId = userId;
    const data = await rich.save();

    await richCalcultion(month, userId);

    await month.save();

    //
    res.status(200).json({ message: 'Update Rich successfully.', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteMemberRich = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const monthId = req.params.monthId;

    const month = await Month.findById(monthId);
    // .select(
    //   'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    // );
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }

    const rich = await Rich.findById(_id);
    if (!rich) {
      throw {
        statusCode: 404,
        errors: {
          rich: 'all Rady deleted!',
        },
      };
    }
    let userId = rich.userId;
    const data = await Rich.findByIdAndDelete(_id);

    await richCalcultion(month, userId);

    await month.save();

    // send respose
    res.status(201).json({ message: 'Delete rich  successfully..', data });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMemberRichList = async (req, res, next) => {
  try {
    const messId = req.messId;
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: messId }, { monthTitel: activeDate }],
    });
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }

    const rich = await Rich.find({
      $and: [{ messId: messId }, { monthId: month._id }],
    }).populate('userId', 'name');

    if (!rich) {
      return res.status(200).json({ message: 'No rich found', data: {} });
    }
    res.status(201).json({ message: 'Get your mass.', data: rich });
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
    const _id = req.params.id;

    const rich = await Rich.findById(_id);
    if (!rich) {
      return res.status(200).json({ message: 'No rich found.', data: {} });
    }

    res.status(200).json({ message: 'Get your rich.', data: rich });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// end Rich ***********

// cost ***********

exports.addMarketCost = async (req, res, next) => {
  try {
    const type = req.body.type;
    const titel = req.body.titel;
    const amount = req.body.amount;
    const purchasedate = req.body.purchasedate || new Date();
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [
        { messId: req.messId },
        { monthTitel: activeDate },
        { managerId: req.userId },
      ],
    });
    // .select(
    //   'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    // );

    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }
    // add  Market Cost

    const cost = new Cost({
      messId: req.messId,
      monthId: month._id,
      type: type,
      titel: titel,
      amount: amount,
      purchasedate: purchasedate,
    });

    await cost.save();

    await calculation(month, req);

    await month.save();

    //  const length = month.cost.length - 1;
    // const recentCost = month.cost[length];
    //
    // send respose
    res.status(201).json({ message: 'Add Cost successfull.', cost, month });
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
    const monthId = req.params.monthId;
    const type = req.body.type;
    const _id = req.params.id;
    const titel = req.body.titel;
    const amount = req.body.amount;
    const purchasedate = req.body.purchasedate || new Date();

    const month = await Month.findOne({ _id: monthId }).select(
      'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    );
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'Month not found!',
        },
      };
    }

    const cost = await Cost.findById(_id);
    if (!cost) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'Cost not found!',
        },
      };
    }
    (cost.type = type), (cost.titel = titel), (cost.amount = amount);
    cost.purchasedate = purchasedate;
    const data = await cost.save();

    await calculation(month, req);

    await month.save();

    // send respose
    res.status(201).json({ message: 'edit cost succussful.', month, data });
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
    const _id = req.params.id;

    const month = await Month.findOne({ managerId: req.userId }).select(
      'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    );
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found!',
        },
      };
    }
    const cost = await Cost.findByIdAndDelete(_id);
    if (!cost) {
      throw {
        statusCode: 404,
        errors: {
          cost: 'Cost not found.',
        },
      };
    }

    await calculation(month, req);

    await month.save();

    // send respose
    res.status(201).json({ message: 'eidt cost.', month, cost });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getMarketCostList = async (req, res, next) => {
  try {
    const messId = req.messId;
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: messId }, { monthTitel: activeDate }],
    });
    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Month not found.',
        },
      };
    }
    const costlist = await Cost.find({
      $and: [{ messId: messId }, { monthId: month._id }],
    });

    if (!costlist) {
      return res.status(200).json({ message: 'Not found cost list', data: {} });
    }

    // calculation(month, req);

    res.status(200).json({ message: 'cost list', data: costlist });
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
    const _id = req.params.id;

    //  const monthId = req.params.id;
    // const month = await Month.findById(monthId);
    // // .select(
    // //   'totalCost totalotherCost totalMealCost totalMeal mealRate otherCostPerPerson balance totalDeposit'
    // // );
    // if (!month) {
    //   throw {
    //     statusCode: 404,
    //     errors: {
    //       month: 'Month not found!',
    //     },
    //   };
    // }

    const cost = await Cost.findById(_id);

    res.status(200).json({ message: 'cost found', cost });
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// end Cost **********

// meal  *****

exports.addDailyBorderMeal = async (req, res, next) => {
  try {
    const dailyMealArray = req.body;
    const messId = req.messId;

    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: req.messId }, { monthTitel: activeDate }],
    }).select('_id totalMeal');

    if (!month) {
      throw {
        statusCode: 404,
        errors: {
          month: 'Now have not  active Month.',
        },
      };
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
      if (!user) {
        throw {
          statusCode: 404,
          errors: {
            month: 'user not found.',
          },
        };
      }
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
    const { messId } = await getUser(req.userId);

    if (!messId) {
      throw {
        statusCode: 404,
        errors: {
          mess: 'You not join any Mess.',
        },
      };
    }
    const activeDate = moment().format('MMMM YYYY');
    const month = await Month.findOne({
      $and: [{ messId: messId }, { monthTitel: activeDate }],
    }).select('_id');
    // some filter query

    // const date = new Date(`${req.query.date}`, 0, 0, 0).toISOString();
    // const dayfilter = date ? { date: { $eq: date } } : {};
    const userId = req.query.userId;
    const userfilter = userId ? { userId: req.userId } : {};
    const meal = await Meal.find({
      $and: [{ messId: messId }, { monthId: month._id }],
      //  ...dayfilter,
      ...userfilter,
    }).populate('userId', 'name');

    if (!meal) {
      throw {
        statusCode: 404,
        errors: {
          meal: 'This Month have a no meal aviabel!',
        },
      };
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
      throw {
        statusCode: 404,
        errors: {
          meal: 'Meal not found !',
        },
      };
    }
    const month = await Month.findById(meal.monthId);
    const userId = meal.userId;
    (meal.breakfast = breakfast),
      (meal.lunch = lunch),
      (meal.dinner = dinner),
      (meal.date = date),
      (meal.total = total);
    await meal.save();
    await richCalcultion(month, userId);
    await month.save();

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
      throw {
        statusCode: 404,
        errors: {
          meal: 'Meal not found !',
        },
      };
    }

    res.status(200).json({ message: 'get meal successfull.', meal });
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
    if (!messId) {
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
  const mess = await Mess.findById(req.messId).select('totalBorder');
  const costSum = await Cost.aggregate([
    {
      $match: {
        $and: [
          { messId: new mongoose.Types.ObjectId(req.messId) },
          { monthId: new mongoose.Types.ObjectId(month._id) },
        ],
      },
    },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const arrObj = {};
  const handleCost = (costSum) => {
    costSum.forEach((cost) => {
      arrObj[cost._id] = cost.total;
    });
    return arrObj;
  };

  const cost = handleCost(costSum);
  const otherCost = cost.otherCost || 0;
  const bigCost = cost.bigCost || 0;
  const smallCost = cost.smallCost || 0;

  month.totalotherCost = otherCost;
  month.totalMealCost = bigCost + smallCost;
  // month.totalMeal = month.totalMeal === 0 ? 1 : month.totalMeal;

  month.mealRate = (month.totalMealCost / month.totalMeal).toFixed(2);

  month.totalCost = bigCost + smallCost + otherCost;

  month.balance = month.totalDeposit - month.totalCost;

  month.otherCostPerPerson = (month.totalotherCost / mess.totalBorder).toFixed(
    2
  );
  return month;
};

const richCalcultion = async (month, userId) => {
  const user = await User.findById(userId).select(
    'totalDepostiRich totalMeal richBalance messId'
  );

  const richSum = await Rich.aggregate([
    {
      $match: {
        $and: [
          { messId: new mongoose.Types.ObjectId(month.messId) },
          { monthId: new mongoose.Types.ObjectId(month._id) },
          { userId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    { $group: { _id: '$month', total: { $sum: '$amount' } } },
  ]);

  const monthRichSum = await Rich.aggregate([
    {
      $match: {
        $and: [
          { messId: new mongoose.Types.ObjectId(month.messId) },
          { monthId: new mongoose.Types.ObjectId(month._id) },
        ],
      },
    },
    { $group: { _id: '$month', total: { $sum: '$amount' } } },
  ]);

  //console.log(richSum);
  const rich = richSum[0];
  const monthRich = monthRichSum[0];

  // console.log(monthRich?.total);
  user.totalDepostiRich = rich?.total;

  user.richBalance = user.totalDepostiRich - user.totalMeal;
  await user.save();
  month.totalRich = monthRich?.total;
  month.richBalance = month.totalRich - month.totalMeal;
  return month;
};

const cashCalcultion = async (month, userId) => {
  const user = await User.findById(userId).select(
    ' totalDeposit totalCost balance messId'
  );

  const cashSum = await Cash.aggregate([
    {
      $match: {
        $and: [
          { messId: new mongoose.Types.ObjectId(month.messId) },
          { monthId: new mongoose.Types.ObjectId(month._id) },
          { userId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    { $group: { _id: '$month', total: { $sum: '$amount' } } },
  ]);

  const monthCashSum = await Cash.aggregate([
    {
      $match: {
        $and: [
          { messId: new mongoose.Types.ObjectId(month.messId) },
          { monthId: new mongoose.Types.ObjectId(month._id) },
        ],
      },
    },
    { $group: { _id: '$month', total: { $sum: '$amount' } } },
  ]);

  const cash = cashSum[0];
  const monthCash = monthCashSum[0];

  user.totalDeposit = cash?.total;
  user.balance = (user.totalDeposit - user.totalCost).toFixed(2);
  await user.save();
  month.totalDeposit = monthCash?.total;
  return month;
};

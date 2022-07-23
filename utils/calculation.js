const User = require('../models/user');
const Cash = require('../models/cash');
const Rich = require('../models/rich');
const Mess = require('../models/mess');
const Cost = require('../models/cost');

module.exports.cashCalcultion = async (month, userId) => {
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

module.exports.richCalcultion = async (month, userId) => {
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

module.exports.userMealCalcultaion = async (month, userId) => {
  const user = await User.findById(userId);
  user.richBalance = user.totalDepostiRich - user.totalMeal;
  user.fixedMeal =
    user.totalMeal > month.fixedMeal ? user.totalMeal : month.fixedMeal;

  user.mealCost = (month.mealRate * user.fixedMeal).toFixed(2);
  user.otherCost = month.otherCostPerPerson;
  user.totalCost = (user.mealCost + user.otherCost).toFixed(2);

  user.balance = (user.totalDeposit - user.totalCost).toFixed(2);

  await user.save();
};

module.exports.calculation = async (month, req) => {
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

  month.totalOtherCost = otherCost;
  month.totalMealCost = bigCost + smallCost;
  // month.totalMeal = month.totalMeal === 0 ? 1 : month.totalMeal;

  month.mealRate = (month.totalMealCost / month.totalFixedMeal).toFixed(2);

  month.totalCost = bigCost + smallCost + otherCost;

  month.balance = month.totalDeposit - month.totalCost;

  month.otherCostPerPerson = (month.totalOtherCost / mess.totalBorder).toFixed(
    2
  );
  return month;
};

const mongoose = require('mongoose');

// const dailyMealSchema = mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     breakfast: { type: Number, default: 0 },
//     lunch: { type: Number, default: 0 },
//     dinner: { type: Number, default: 0 },
//     total: { type: Number, default: 0 },
//     date: { type: Date },
//   },
//   { timestamps: true }
// );

const monthSchema = mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messName: {
      type: String,
      default: 'Bachelor_Point',
    },
    monthTitel: {
      type: String,
    },
    // totalMonthBorder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    totalDeposit: {
      type: Number,
      default: 0.0,
    },
    totalMealCost: {
      type: Number,
      default: 0,
    },
    totalotherCost: {
      type: Number,
      default: 0.0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    totalRich: {
      type: Number,
      default: 0,
    },
    //  dailyMeal: [dailyMealSchema],
    totalMeal: {
      type: Number,
      default: 1,
    },
    mealRate: {
      type: Number,
      default: 1,
    },
    otherCostPerPerson: {
      type: Number,
      default: 0.0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Month', monthSchema);

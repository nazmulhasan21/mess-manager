const mongoose = require('mongoose');

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
    totalMeal: {
      type: Number,
      default: 0.0,
    },
    mealRate: {
      type: Number,
      default: 0.0,
    },
    totalotherCost: {
      type: Number,
      default: 0.0,
    },
    otherCostPerPerson: {
      type: Number,
      default: 0.0,
    },
    // bigCost: [
    //   {
    //     titel: {
    //       type: String,
    //     },
    //     amount: {
    //       type: Number,
    //       default: 0,
    //     },
    //     purchasedate: {
    //       type: Date,
    //     },
    //   },
    // ],
    // smallCost: [
    //   {
    //     titel: {
    //       type: String,
    //     },
    //     amount: {
    //       type: Number,
    //       default: 0,
    //     },
    //     purchasedate: {
    //       type: Date,
    //     },
    //   },
    // ],
    // otherCost: [
    //   {
    //     titel: {
    //       type: String,
    //     },
    //     amount: {
    //       type: Number,
    //       default: 0,
    //     },
    //     purchasedate: {
    //       type: Date,
    //     },
    //   },
    // ],
    cost: [
      {
        type: {
          type: String,
          enum: ['bigCost', 'smallCost', 'otherCost'],
        },
        titel: {
          type: String,
        },
        amount: {
          type: Number,
          default: 0,
        },
        purchasedate: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Month', monthSchema);

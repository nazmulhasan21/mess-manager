const mongoose = require('mongoose');

const dailyMealSchema = mongoose.Schema(
  {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String, // do not change this type number.
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    institution: {
      type: String,
      default: 'NOT_SET_YET',
    },
    address: {
      type: String,
      default: 'NOT_SET_YET',
    },
    avater: {
      type: String,
      default: '/images/mess_manager_profile_vector-01.png',
    },
    depositAmount: [
      {
        amount: { type: Number, default: 0 },
        depositDate: { type: Date },
      },
    ],
    totalDeposit: {
      type: Number,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    mealCost: {
      type: Number,
      default: 0.0,
    },
    otherCost: {
      type: Number,
      default: 0.0,
    },
    depositRich: [
      {
        amount: { type: Number, default: 0 },
        depositDate: { type: Date },
      },
    ],
    totalDepostiRich: {
      type: Number,
      default: 0.0,
    },
    dailyMeal: [dailyMealSchema],
    totalMeal: {
      type: Number,
      default: 0.0,
    },
    role: {
      type: String,
      default: 'border',
    },
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
    },
    // emailVerified: {
    //   type: Boolean,
    //   default: false,
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

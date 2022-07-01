const mongoose = require('mongoose');

const dailyMealSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
    },
    monthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Month',
    },
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    date: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', dailyMealSchema);

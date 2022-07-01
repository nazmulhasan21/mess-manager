const mongoose = require('mongoose');

const richSchema = mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
    },
    monthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Month',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      default: 0,
    },
    depositDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rich', richSchema);

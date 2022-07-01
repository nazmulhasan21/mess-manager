const mongoose = require('mongoose');

const costSchema = mongoose.Schema(
  {
    messId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mess',
    },
    monthId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Month',
    },
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
  { timestamps: true }
);

module.exports = mongoose.model('Cost', costSchema);

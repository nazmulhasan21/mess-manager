const mongoose = require('mongoose');

const messSchema = mongoose.Schema(
  {
    messName: {
      type: String,
      required: true,
    },
    allMember: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalBorder: {
      type: Number,
      default: 1,
    },
    month: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Month' }],
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mess', messSchema);

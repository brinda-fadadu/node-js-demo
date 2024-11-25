const mongoose = require("mongoose");

const expiredPlanQuerySchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    user_message: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const expiredPlanQueryModel = mongoose.model(
  "ExpiredPlanQuery",
  expiredPlanQuerySchema
);

module.exports = {
  expiredPlanQueryModel,
};

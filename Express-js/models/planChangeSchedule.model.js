const mongoose = require("mongoose");

const planChangeScheduleSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plans",
      required: true,
    },
    user_plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPlans",
      required: true,
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    plan_upgrade_date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "completed", "failed"],
    },
    subscription_id: {
      type: String,
      required: true,
    },
    sub_item_id: {
      type: String,
      required: true,
    },
    price_id: {
      type: String,
      required: true,
    },
    is_fullfilled: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    fullfilled_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const planChangeScheduleModel = mongoose.model(
  "PlanChangeSchedule",
  planChangeScheduleSchema
);

module.exports = {
  planChangeScheduleModel,
};

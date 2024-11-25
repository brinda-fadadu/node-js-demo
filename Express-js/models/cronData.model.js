const mongoose = require("mongoose");
const validator = require("validator");

const cronDataSchema = mongoose.Schema(
  {
    start_date_time: {
      type: Date,
    },
    end_date_time: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
      default: "not-started", // "not-started","running","completed","failed"
    },
    job_name: {
      type: "String", // "Data Sync Up Job","Notification Job"
    },
    stage: {
      type: "String",
      required: true,
      default: "stage-0",
      /**
       *
       *  stage-0 : Cron started
       *  stage-1 : deleteOldHistory completed
       *  stage-2 : checkAndUpdatePlanStatus completed
       *  stage-3 : sendSignupNotification completed
       *  stage-4 : sendPlanExpireNotification completed
       *  stage-5 : submitScheduledPlanChangeRequests completed
       *  stage-6 : sendScoringSuccessNotifications and Cron completed
       */
    },
    cron_error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const cronDataModel = mongoose.model("crondata", cronDataSchema);
module.exports = {
  cronDataModel,
};

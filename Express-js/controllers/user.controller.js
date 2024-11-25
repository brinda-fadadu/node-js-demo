const { requestValidator } = require("../helpers/request.validator");
const UserService = require("../services/user.service");
const PreferenceService = require("../services/preferences.service");
const HistoryService = require("../services/history.service");
const H2OHubService = require("../services/h2o_hub.service");
const ScoreService = require("../services/score.service");
const PlanService = require("../services/plan.service");
const CategoryService = require("../services/category.service");
const StripeService = require("../services/stripe.service");
const { ObjectId } = require("mongodb");
const Messages = require("../user.messages.json");
const {
  returnResponse,
  returnInternalErrorResponse,
} = require("../helpers/response_return");
const fs = require("fs");
const path = require("path");
const EmailService = require("../helpers/email.service");
const S3Service = require("../helpers/s3.service");
const PreferenceEncoder = require("../helpers/preference.encode_decode");
const { default: axios } = require("axios");
const moment = require("moment");
const _ = require("underscore");
const { preferenceModel } = require("../models/preference.model");
const { userPlansModel } = require("../models/userPlans.model");
const { sessionModel } = require("../models/session.model");
const CloudWatchService = require("../helpers/cloudwatch.service");

const test = async (req, res) => {
  try {
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = "User Authenticated.")
    );
  } catch (error) {
    console.log("Error from function ( test ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( test ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Preference Related Controllers ------------------- //

const savePreferences = async (req, res) => {
  try {
    // checking if user exists
    let user = await UserService.getUserByEmail(req.user.email);
    if (!user) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["savePreferences_400"])
      );
    }
    // mapping preferences
    let preferenceDataObj = {
      nutrition: await PreferenceService.handlePreferenceMapping(
        req.body.nutrition
      ),
      ingredients__and__processing:
        await PreferenceService.handlePreferenceMapping(
          req.body.ingredients__and__processing
        ),
      sustainability: await PreferenceService.handlePreferenceMapping(
        req.body.sustainability
      ),
      allergens: await PreferenceService.handlePreferenceMapping(
        req.body.allergens
      ),
    };

    // saving preferences
    let updated_user = await UserService.updateUserById(user._id, {
      preferences: preferenceDataObj,
    });
    // profile pic link setting
    if (updated_user.profile_pic) {
      updated_user.profile_pic =
        process.env.AWS_BUCKET_BASE_URL +
        "profile_pictures/" +
        updated_user.profile_pic;
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["savePreferences_200"]),
      (error = ""),
      (data = {
        _id: updated_user._id,
        name: updated_user.name,
        email: updated_user.email,
        preferences: updated_user.preferences,
      })
    );
  } catch (error) {
    console.log("Error from function ( savePreferences ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( savePreferences ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getMyPreferences = async (req, res) => {
  try {
    // getting user preferences
    let user = await PreferenceService.getUserPreferences(req.user.email);
    if (!user) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["getMyPreferences_400"])
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getMyPreferences_200"]),
      (error = ""),
      (data = user.preferences)
    );
  } catch (error) {
    console.log("Error from function ( getMyPreferences ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getMyPreferences ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getPreferences = async (req, res) => {
  try {
    // getting active preferences
    let preferences = await PreferenceService.getActivePreferences();
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getPreferences_200"]),
      (error = ""),
      (data = preferences)
    );
  } catch (error) {
    console.log("Error from function ( getPreferences ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getPreferences ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Profile Related Controllers ------------------- //

const updateProfile = async (req, res) => {
  try {
    console.log("REq.file", req.file);
    // checking if user exists
    let user = await UserService.getUserByEmail(req.user.email);
    if (!user) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["updateProfile_400_user_not_found"])
      );
    }
    let profile_pic = "";
    // checking if dob is valid
    if (
      req.body.dob &&
      moment(req.body.dob, "MM-DD-YYYY").toDate() == "Invalid Date"
    ) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["updateProfile_400_invalid_date"]),
        (error = Messages["updateProfile_400_invalid_date"])
      );
    }
    // checking if profile pic is uploaded
    if (req.file && req.file.location) {
      const currentUser = await UserService.findUserByEmail(
        req.user.email,
        false
      );
      // console.log("PPP :", currentUser.profile_pic.split("/profile_pictures/")[1]);
      if (currentUser.profile_pic) {
        let deletedPic = await S3Service.deletePhoto(
          // process.env.AWS_BUCKET_BASE_URL +
          "profile_pictures/" + currentUser.profile_pic
        );
        if (!deletedPic.success) {
          console.log(
            "Error while deleting user profile image",
            deletedPic.error
          );
        }
        // const profile_picPath = path.join(
        //   __dirname,
        //   "../static/uploads/profile_pictures"
        // );
        // fs.unlink(
        //   path.join(profile_picPath, currentUser.profile_pic),
        //   (err) => {
        //     console.log("Error : ", err);
        //   }
        // );
      }
      // profile_pic = req.file.filename;
      // profile_pic = req.file.location;
      profile_pic = req.file.key.split("profile_pictures/")[1];
      console.log("ProfilePic : ", profile_pic);
      req.body["profile_pic"] = profile_pic;
    }
    // checking if profile pic is removed
    if (req.body.isImageRemoved == "true") {
      const currentUser = await UserService.findUserByEmail(
        req.user.email,
        false
      );
      if (currentUser.profile_pic) {
        let deletedPic = await S3Service.deletePhoto(
          // process.env.AWS_BUCKET_BASE_URL +
          "profile_pictures/" + currentUser.profile_pic
        );
        if (!deletedPic.success) {
          console.log(
            "Error while deleting user profile image",
            deletedPic.error
          );
        }
        // const profile_picPath = path.join(
        //   __dirname,
        //   "../static/uploads/profile_pictures"
        // );
        // fs.unlink(
        //   path.join(profile_picPath, currentUser.profile_pic),
        //   (err) => {
        //     console.log("Error : ", err);
        //   }
        // );
      }
      req.body["profile_pic"] = "";
    }
    // making sure that email is not updated
    if (req.body.email && req.body.email !== user.email) {
      req.body.email = user.email;
    }
    // checking weight and height
    let new_weight = null;
    if (req.body.weight && isNaN(parseFloat(req.body.weight))) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["updateProfile_400_invalid_weight"]),
        (error = Messages["updateProfile_400_invalid_weight"])
      );
    }
    if (req.body.height && isNaN(parseFloat(req.body.height))) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["updateProfile_400_invalid_height"]),
        (error = Messages["updateProfile_400_invalid_height"])
      );
    }
    // calculating bmi
    if (req.body.weight) {
      new_weight = parseFloat(req.body.weight);
      if (req.body.weight_unit == "lb") {
        new_weight = parseFloat(req.body.weight) / 2.205;
      }
    } else {
      req.body.weight = 0;
    }
    let new_height = null;
    if (req.body.height) {
      new_height = parseFloat(req.body.height);

      if (req.body.height_unit == "in") {
        new_height = parseFloat(req.body.height) * 2.54;
      }
    } else {
      req.body.height = 0;
    }
    if (new_weight && new_height) {
      req.body.bmi = new_weight / (new_height * 0.01) ** 2;
    }
    let fields = [
      "name",
      "phone_number",
      "preferences",
      "profile_pic",
      "dob",
      "ethnicity",
      "height",
      "weight",
      "height_unit",
      "weight_unit",
      "gender",
      "health_condition",
      "mobile_token",
      // "mobile_token",
    ];
    // // console.log("Before : ", Object.keys(data));
    Object.keys(req.body).map((ite) => {
      if (!fields.includes(ite)) {
        delete req.body[ite];
      }
    });
    // updating user
    let updated_user = await UserService.updateUserById(user._id, req.body);
    if (updated_user && updated_user.profile_pic) {
      // setting profile pic link
      updated_user.profile_pic =
        process.env.AWS_BUCKET_BASE_URL +
        "profile_pictures/" +
        updated_user.profile_pic;
    }

    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["updateProfile_200"]),
      (error = ""),
      (data = {
        _id: updated_user._id,
        name: updated_user.name,
        email: updated_user.email,
        height_unit: updated_user.height_unit,
        weight_unit: updated_user.weight_unit,
        height: updated_user.height,
        weight: updated_user.weight,
        dob: updated_user.dob,
        ethnicity: updated_user.ethnicity,
        gender: updated_user.gender,
        health_condition: updated_user.health_condition,
        phone_number: updated_user.phone_number,
        profile_pic: updated_user.profile_pic,
      })
    );
  } catch (error) {
    console.log("Error from function ( updateProfile ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( updateProfile ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getProfile = async (req, res) => {
  try {
    // checking if user exists
    let user = await UserService.getUserByEmail(req.user.email);
    if (!user) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["getProfile_400_user_not_found"])
      );
    }
    if (req.body.email && req.body.email !== user.email) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["getProfile_400_email_update"])
      );
    }
    // setting profile pic link
    if (user.profile_pic) {
      user.profile_pic =
        process.env.AWS_BUCKET_BASE_URL +
        "profile_pictures/" +
        user.profile_pic;
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getProfile_200"]),
      (error = ""),
      (data = user)
    );
  } catch (error) {
    console.log("Error from function ( getProfile ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getProfile ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Guest User Permission Controllers ------------------- //

const getGuestUserPermission = async (req, res) => {
  try {
    // checking if guest user is allowed for further queries
    let isAllowed = await UserService.checkGuestUserPermission(
      req.body.finger_print
    );
    return returnResponse(
      (res = res),
      (success = isAllowed.success),
      (statusCode = isAllowed.success ? 200 : 400),
      (message = isAllowed.message),
      (error = isAllowed.error),
      (data = isAllowed.data)
    );
  } catch (error) {
    console.log("Error from function ( getGuestUserPermission ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getGuestUserPermission ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Support Query Controllers ------------------- //

const saveSupportQuery = async (req, res) => {
  try {
    req.body.email = req.body.email.toLowerCase();
    // saving support query
    let support_query = await UserService.saveSupportQuery(req.body);
    if (!support_query.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = support_query.message)
      );
    }
    // sending email to admin
    let email_sent = await EmailService.sendEmail({
      email: [process.env.H2O_SUPORT_EMAIL],
      subject: "User Support Query",
      template: "support",
      data: {
        NAME: req.body.name,
        EMAIL: req.body.email,
        MESSAGE: req.body.message,
      },
    });
    if (!email_sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = email_sent.error),
        (error = email_sent.error)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["saveSupportQuery_200"]),
      (error = ""),
      (data = support_query.data)
    );
  } catch (error) {
    console.log("Error from function ( saveSupportQuery ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( saveSupportQuery ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Session Controllers ------------------- //

const saveSession = async (req, res) => {
  try {
    // saving session
    let session = await HistoryService.saveSession(
      req.body.session_id,
      req.user.id
    );
    if (!session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = session.message)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["saveSession_200"]),
      (error = ""),
      (data = session.data)
    );
  } catch (error) {
    console.log("Error from function ( saveSession ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( saveSession ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- History Controllers ------------------- //

const getHistory = async (req, res) => {
  try {
    // getting user history
    let hisotry = await HistoryService.getHistory(req.user.id);
    if (!hisotry.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = hisotry.message),
        (error = hisotry.error),
        (data = hisotry.data)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getHistory_200"]),
      (error = ""),
      (data = hisotry.data)
    );
  } catch (error) {
    console.log("Error from function ( getHistory ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getHistory ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getPaginatedHistory = async (req, res) => {
  try {
    // getting user history
    if (!req.query.page || !req.query.limit) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "page and limit required"),
        (error = "page and limit required"),
        (data = null)
      );
    }
    let hisotry = await HistoryService.getPaginatedHistory(
      req.user.id,
      req.query.page ? parseInt(req.query.page) : 1,
      req.query.limit ? parseInt(req.query.limit) : 10
    );
    if (!hisotry.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = hisotry.message),
        (error = hisotry.error),
        (data = hisotry.data)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getHistory_200"]),
      (error = ""),
      (data = hisotry.data)
    );
  } catch (error) {
    console.log("Error from function ( getHistory ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getHistory ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getHistoryDataById = async (req, res) => {
  try {
    // getting user history by id
    let session_id = req.params.id;
    let history = await HistoryService.getUserHistoryById(
      session_id,
      req.user.id
      // req.query.page ? parseInt(req.query.page) : 1,
      // req.query.limit ? parseInt(req.query.limit) : 10
    );
    if (!history.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = history.message),
        (error = history.error),
        (data = history.data)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getHistoryDataById_200"]),
      (error = ""),
      (data = history.data)
    );
  } catch (error) {
    console.log("Error from function ( getHistoryDataById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getHistoryDataById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getPaginatedHistoryDataById = async (req, res) => {
  try {
    // getting user history by id
    console.log("getPaginatedHistoryDataById Started : ", moment().valueOf());
    let session_id = req.params.id;
    if (!req.query.action || !req.query.filter_id) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "Action and filter_id required"),
        (error = "Action and filter_id required"),
        (data = null)
      );
    }
    let limit = 5;
    console.log(
      "getPaginatedHistoryDataById ( History Service ) called: ",
      moment().valueOf()
    );

    let history = await HistoryService.getPaginatedUserHistoryById(
      session_id,
      req.user.id,
      req.query.action,
      req.query.filter_id,
      limit
      // req.query.page ? parseInt(req.query.page) : 1,    
      // req.query.limit ? parseInt(req.query.limit) : 10   
    );
    console.log(
      "getPaginatedHistoryDataById ( History Service ) received: ",
      moment().valueOf()
    );

    if (!history.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = history.message),
        (error = history.error),
        (data = history.data)
      );
    }
    console.log("getPaginatedHistoryDataById Ended : ", moment().valueOf());
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getHistoryDataById_200"]),
      (error = ""),
      (data = history.data)
    );
  } catch (error) {
    console.log("Error from function ( getHistoryDataById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getHistoryDataById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const deleteHistoryById = async (req, res) => {
  try {
    // deleting history by id
    let history = await UserService.deleteHistoryById(
      req.user.id,
      req.body.history_id
    );
    if (!history.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = history.message),
        (error = history.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["deleteHistoryById_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( deleteHistoryById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( deleteHistoryById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const deleteHistoryLineItemById = async (req, res) => {
  try {
    // deleting history by id
    let history = await UserService.deleteHistoryLineItemById(
      req.user.id,
      req.body.question_id
    );
    if (!history.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = history.message),
        (error = history.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["deleteHistoryLineItemById_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( deleteHistoryLineItemById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( deleteHistoryLineItemById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const deleteUserHistory = async (req, res) => {
  try {
    // deleting user history
    let history = await UserService.deleteUserHistory(req.user.id);
    if (!history.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = history.message),
        (error = history.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["deleteHistoryById_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( deleteHistoryById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( deleteHistoryById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Product Scoring Controllers ------------------- //

const getScoreStatusForProduct = async (req, res) => {
  try {
    // checking if user preferences and product scoring information is provided
    if (!req.body.user_id && !req.body.user_preferences) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message =
          Messages[
            "getScoreStatusForProduct_400_userid_user_preference_error"
          ]),
        (error =
          Messages[
            "getScoreStatusForProduct_400_userid_user_preference_error"
          ]),
        (data = null)
      );
    }
    if (!req.body.product_id && !req.body.scoring_information) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message =
          Messages[
            "getScoreStatusForProduct_400_product_id_scoring_information_error"
          ]),
        (error =
          Messages[
            "getScoreStatusForProduct_400_product_id_scoring_information_error"
          ]),
        (data = null)
      );
    }
    // getting user preferences and product scoring information
    let user_preferences = null;
    let scoring_information = null;
    if (!req.body.user_preferences) {
      let user = await UserService.getUserById(req.body.user_id);
      if (!user) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message =
            Messages[
              "getScoreStatusForProduct_400_userid_user_preference_error"
            ]),
          (error =
            Messages[
              "getScoreStatusForProduct_400_userid_user_preference_error"
            ]),
          (data = null)
        );
      }
      user_preferences = user.preferences;
    } else {
      user_preferences = req.body.user_preferences;
    }
    // getting product scoring information
    if (!req.body.scoring_information) {
      let product_score = await UserService.getProductScoring(
        req.body.product_id
      );
      if (product_score.success) {
        scoring_information = product_score.data;
      }
    } else {
      scoring_information = req.body.scoring_information;
    }
    let preference_object = await preferenceModel.findOne({
      is_deleted: false,
    });
    let dt = await ScoreService.formatData(scoring_information, true);
    if (!dt.scoring_information) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "No scoring information found"),
        (error = "No scoring information found"),
        (data = null)
      );
    }
    // getting score match result
    let score_match_result = await ScoreService.getScoreMatch(
      user_preferences,
      dt.scoring_information,
      preference_object
    );
    if (score_match_result.success) {
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = Messages["getScoreStatusForProduct_200"]),
        (error = ""),
        (data = {
          product_id: req.body.product_id.toString(),
          user_id: req.body.user_id,
          match_status: score_match_result.data.match_status,
        })
      );
    } else {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = score_match_result.error),
        (error = score_match_result.error),
        (data = null)
      );
    }
  } catch (error) {
    console.log("Error from function ( getScoreStatusForProduct ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getScoreStatusForProduct ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getScoreForProduct = async (req, res) => {
  try {
    
    let resp = await H2OHubService.checkCacheDbForScoring(
      req.body.product_id.toString()
    );
    // console.log("REsp => ", resp);
    let scoring_information = null;

    if (resp.success) {
      let score_result = await ScoreService.getScore(
        resp.data.scoring_information.h2o_score_info
      );
      if (score_result.success) {
        return returnResponse(
          (res = res),
          (success = true),
          (statusCode = 200),
          (message = Messages["getScoreForProduct_200"]),
          (error = ""),
          (data = {
            product_id: req.body.product_id,
            score: score_result.data,
          })
        );
      } else {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 500),
          (message = score_result.error),
          (error = score_result.error),
          (data = null)
        );
      }
    } else {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = "Error from h2o hub api"),
        (error = "Error from h2o hub api"),
        (data = null)
      );
    }
  } catch (error) {
    console.log("Error from function ( getScoreForProduct ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getScoreForProduct ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getProductScoringById = async (req, res) => {
  try {
    // getting product scoring information by id
    let result = await UserService.getProductScoring(req.params.id);
    if (!result.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = result.error),
        (error = result.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getProductScoringById_200"]),
      (error = ""),
      (data = result.data)
    );
  } catch (error) {
    console.log("Error from function ( getProductScoringById ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getProductScoringById ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Product Controllers ------------------- //

const getProductInfo = async (req, res) => {
  try {
    // getting product information
    let product_id = req.params.id;
    let product = await H2OHubService.getProductInfo(
      product_id,
      req.user.email
    );
    if (!product.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = product.message),
        (error = product.error),
        (data = null)
      );
    }
    // checking if product is liked by user
    let user = await UserService.findUserByEmail(req.user.email, false);
    product.data.is_liked = user.liked_products.includes(product_id.toString());
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getProductInfo_200"]),
      (error = ""),
      (data = product.data)
    );
  } catch (error) {
    console.log("Error from function ( getProductInfo ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getProductInfo ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const likeDislikeProduct = async (req, res) => {
  try {
    // liking or disliking product
    let result = await UserService.likeDislikeProductId(
      req.user.id,
      req.body.product_id
    );
    if (!result.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = result.message),
        (error = result.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = result.message),
      (error = ""),
      (data = result.data)
    );
  } catch (error) {
    console.log("Error from function ( likeDislikeProduct ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( likeDislikeProduct ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Wishlist and Top Products Controllers ------------------- //

const getWishlist = async (req, res) => {
  try {
    // getting user wishlist
    let wishlist = await UserService.getWishListById(req.user.id);
    if (!wishlist.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = wishlist.message),
        (error = wishlist.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = wishlist.message),
      (error = ""),
      (data = wishlist.data)
    );
  } catch (error) {
    console.log("Error from function ( getWishlist ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getWishlist ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getWishlistCategorywise = async (req, res) => {
  try {
    // getting user wishlist
    let wishlist = await UserService.getWishListByIdWithCategory(req.user.id);
    if (!wishlist.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = wishlist.message),
        (error = wishlist.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = wishlist.message),
      (error = ""),
      (data = wishlist.data)
    );
  } catch (error) {
    console.log("Error from function ( getWishlistCategorywise ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getWishlistCategorywise ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const extractTopProductsForUser = async (req, res) => {
  try {
    // req.body validation
    let user_preferences = null;
    let num_of_top_products = req.body.num_of_top_products
      ? req.body.num_of_top_products
      : 5;
    let category = req.body.category ? req.body.category : null;
    let sub_category = req.body.sub_category ? req.body.sub_category : null;
    // getting user preferences
    if (!req.body.user_preferences) {
      if (!req.body.user_id) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = Messages["extractTopProductsForUser_400"]),
          (error = Messages["extractTopProductsForUser_400"]),
          (data = null)
        );
      }
      let user = await UserService.getUserById(req.body.user_id);
      if (!user) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = "User not found"),
          (error = "User not found"),
          (data = null)
        );
      }
      user_preferences = user.preferences;
    } else {
      user_preferences = req.body.user_preferences;
    }
    // getting top products
    let top_products = await H2OHubService.getTopProducts(
      user_preferences,
      num_of_top_products,
      category,
      sub_category
    );
    if (!top_products.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = top_products.message),
        (error = top_products.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["extractTopProductsForUser_200"]),
      (error = ""),
      (data = top_products.data)
    );
  } catch (error) {
    console.log("Error from function ( extractTopProductsForUser ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( extractTopProductsForUser ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Better Alternatives Controllers ------------------- //

const betterAlternativesForProduct = async (req, res) => {
  try {
    // getting user preferences
    let user_preferences = await PreferenceService.getUserPreferences(
      req.user.email
    );
    // getting better alternatives
    let alternatives = await H2OHubService.getBetterAlternatives(
      req.body.product_id,
      user_preferences.preferences ? user_preferences.preferences : []
    );
    if (!alternatives.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = alternatives.message),
        (error = alternatives.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["betterAlternativesForProduct_200"]),
      (error = ""),
      (data = alternatives.data)
    );
  } catch (error) {
    console.log(
      "Error from function ( betterAlternativesForProduct ) : ",
      error
    );
    CloudWatchService.logToCloudWatch(
      "Error from function ( betterAlternativesForProduct ) : " +
        error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Compare Products Controllers ------------------- //

const compareProductsData = async (req, res) => {
  try {
    // checking plan status
    if (!req.user.plan_status) {
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = Messages["compareProductsData_400_plan_status"]),
        (data = null)
      );
    }
    // getting user preferences
    let user_preferences = await PreferenceService.getUserPreferences(
      req.user.email
    );
    if (!user_preferences.preferences) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["compareProductsData_400_user_preference"])
      );
    }
    // validating input product ids
    if (
      !req.body.other_product_ids ||
      (req.body.other_product_ids && req.body.other_product_ids.length) == 0
    ) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["compareProductsData_400_product_id"])
      );
    }
    // getting compare data
    let compare_data = await H2OHubService.compareProductsData(
      req.body.main_product_id,
      req.body.other_product_ids,
      user_preferences.preferences
    );
    if (!compare_data.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = compare_data.message),
        (error = compare_data.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["compareProductsData_200"]),
      (error = ""),
      (data = compare_data.data)
    );
  } catch (error) {
    console.log("Error from function ( compareProductsData ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( compareProductsData ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Change Scoring Controllers ------------------- //

const changeScoring = async (req, res) => {
  try {
    let score = await H2OHubService.changeScoring(req.body.scoring_information);
    if (!score.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 500),
        (message = score.message),
        (error = score.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = score.message),
      (error = ""),
      (data = score.data)
    );
  } catch (error) {
    console.log("Error from function ( changeScoring ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( changeScoring ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Category Controllers ------------------- //

const getCategoryByCountry = async (req, res) => {
  try {
    let country = req.params.country;
    // getting categories by country
    let categories = await CategoryService.getCategoryByCountry(country);
    if (!categories.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = categories.message),
        (error = categories.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getCategoryByCountry_200"]),
      (error = ""),
      (data = categories.data)
    );
  } catch (error) {
    console.log("Error from function ( getCategoryByCountry ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getCategoryByCountry ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const topProducts = async (req, res) => {
  try {
    // getting category by country
    let category = await CategoryService.getCategoryByCountry(req.body.country);
    if (!category.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = category.message),
        (error = category.error),
        (data = null)
      );
    }
    let error = false;
    for (let i = 0; i < req.body.categories.length; i++) {
      if (
        !_.isEqual(Object.keys(req.body.categories[i]), [
          "category",
          "subCategories",
        ])
      ) {
        error = true;
        break;
      }
    }
    if (error) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["topProducts_400"])
      );
    }
    // getting user preferences
    let user_preferences = await PreferenceService.getUserPreferences(
      req.user.email
    );
    let user = await UserService.findUserByEmail(req.user.email, false);
    // getting top products
    let top_products = await H2OHubService.getTopProductsForCategory(
      req.body.categories,
      user_preferences.preferences ? user_preferences.preferences : [],
      user.liked_products ? user.liked_products : []
    );
    if (!top_products.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = top_products.message),
        (error = top_products.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["topProducts_200"]),
      (error = ""),
      (data = top_products.data)
    );
  } catch (error) {
    console.log("Error from function ( topProducts ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( topProducts ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Plan Controllers ------------------- //

const getPlans = async (req, res) => {
  try {
    // getting plans
    let plans = await PlanService.getPlans();
    if (!plans.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = plans.message),
        (error = plans.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getPlans_200"]),
      (error = ""),
      (data = plans.data)
    );
  } catch (error) {
    console.log("Error from function ( getPlans ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getPlans ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getPlanPrices = async (req, res) => {
  try {
    let plan_id = req.params.id;
    let country = req.query.country;
    // getting plan prices by plan id and country
    let prices = await PlanService.getPlanPrices(plan_id, country);
    if (!prices.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = prices.message),
        (error = prices.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["getPlanPrices_200"]),
      (error = ""),
      (data = prices.data)
    );
  } catch (error) {
    console.log("Error from function ( getPlanPrices ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( getPlanPrices ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Subscription Controllers ------------------- //

const createCheckoutSession = async (req, res) => {
  try {
    // creating checkout session
    let session = await PlanService.createSession(req.user.id, req.body);
    if (!session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = session.message),
        (error = session.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["createSession_200"]),
      (error = ""),
      (data = session.data.stripe_client_secret)
    );
  } catch (error) {
    console.log("Error from function ( createCheckoutSession ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( createCheckoutSession ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const stripeSessionCallback = async (req, res) => {
  try {
    // getting checkout session
    let session = await StripeService.getCheckoutSession(req.body.session_id);
    if (!session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = session.message),
        (error = session.error),
        (data = null)
      );
    }
    // updating session
    let updated_session = await PlanService.updateSession(session.data);
    if (!updated_session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = updated_session.message),
        (error = updated_session.error),
        (data = {
          success: false,
        })
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["stripeSessionCallback_200"]),
      (error = ""),
      (data = updated_session.data)
    );
  } catch (error) {
    console.log("Error from function ( stripeSessionCallback ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( stripeSessionCallback ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const checkPlanStatus = async (req, res) => {
  try {
    // checking plan status
    let plan_details = await PlanService.getPlanDetails(
      req.user.id,
      req.body.country
    );
    if (!plan_details.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = plan_details.message),
        (error = plan_details.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["checkPlanStatus_200"]),
      (error = ""),
      (data = plan_details.data)
    );
  } catch (error) {
    console.log("Error from function ( checkPlanStatus ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( checkPlanStatus ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const cancelSubscription = async (req, res) => {
  try {
    // cancelling subscription
    let cancelled = await PlanService.cancelSubscription(
      req.user.id,
      req.body.reason
    );
    if (!cancelled.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = cancelled.message),
        (error = cancelled.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["cancelSubscription_200"]),
      (error = ""),
      (data = cancelled.data)
    );
  } catch (error) {
    console.log("Error from function ( cancelSubscription ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( cancelSubscription ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const checkUpdatePlanStatus = async (req, res) => {
  try {
    // checking if user can update plan
    let planStatus = await UserService.checkUpdatePlanStatus(req.user.id);
    if (!planStatus.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = planStatus.message),
        (error = planStatus.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = planStatus.message),
      (error = ""),
      (data = planStatus.data)
    );
  } catch (error) {
    console.log("Error from function ( checkUpdatePlanStatus ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( checkUpdatePlanStatus ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// Mobile Subsctiption Update
const createSubscription = async (req, res) => {
  try {
    // creating subscription
    let session = await PlanService.createSubscription(req.user.id, req.body);
    if (!session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = session.message),
        (error = session.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["createSession_200"]),
      (error = ""),
      (data = session.data.stripe_client_secret)
    );
  } catch (error) {
    console.log("Error from function ( createSubscription ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( createSubscription ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const checkSubscription = async (req, res) => {
  try {
    // checking subscription
    let subscription = await StripeService.getSubscription(
      req.body.subscription_id
    );
    if (!subscription.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = subscription.message),
        (error = subscription.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["checkSubscription_200"]),
      (error = ""),
      (data = subscription.data)
    );
  } catch (error) {
    console.log("Error from function ( checkSubscription ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( checkSubscription ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const updateSubscription = async (req, res) => {
  try {
    // updating subscription
    let subscription = await PlanService.updateSubscription(
      req.user.id,
      req.body.client_secret
    );
    if (!subscription.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = subscription.message),
        (error = subscription.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["updateSubscription_200"]),
      (error = ""),
      (data = subscription.data)
    );
  } catch (error) {
    console.log("Error from function ( updateSubscription ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( updateSubscription ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Subscription Query Controllers ------------------- //

const sendSubscriptionQuery = async (req, res) => {
  try {
    // sending subscription query
    let user = await UserService.getUserById(new ObjectId(req.user.id));
    let status_updated = await UserService.updateCancelSubscriptionQuery(
      req.user.id,
      true
    );
    if (!status_updated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = status_updated.message),
        (error = status_updated.error)
      );
    }
    let email_sent = await EmailService.sendEmail({
      email: [process.env.H2O_SUPORT_EMAIL, "xyz@gmail.com"],
      subject: "User subscription query.",
      template: "subscription-query",
      data: {
        NAME: user.name,
        EMAIL: user.email,
        QUERY: req.body.query,
      },
    });
    if (!email_sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = email_sent.error),
        (error = email_sent.error)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["subscriptionQuery_200"]),
      (error = "")
    );
  } catch (error) {
    console.log("Error from function ( sendSubscriptionQuery ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( sendSubscriptionQuery ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Subscription Controllers ------------------- //

const scheduleSubscription = async (req, res) => {
  try {
    // scheduling subscription
    let session = await PlanService.scheduleSubscription(req.user.id, req.body);
    if (!session.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = session.message),
        (error = session.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["createSession_200"]),
      (error = ""),
      (data = session.data.stripe_client_secret)
    );
  } catch (error) {
    console.log("Error from function ( scheduleSubscription ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( scheduleSubscription ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

// ------------------- Notification Controllers ------------------- //

const sendSignupNotification = async (req, res) => {
  try {
    // sending signup notification
    let sent = await UserService.sendSignupNotification();
    if (!sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = sent.message),
        (error = sent.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["sendSignupNotification_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( sendSignupNotification ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( sendSignupNotification ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const sendPlanExpireNotification = async (req, res) => {
  try {
    // sending plan expire notification
    let sent = await UserService.sendPlanExpireNotification();
    if (!sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = sent.message),
        (error = sent.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["sendPlanExpireNotification_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( sendPlanExpireNotification ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( sendPlanExpireNotification ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const sendTempNotification = async (req, res) => {
  try {
    let req_validated = await requestValidator(req.body, ["mobile_token"]);
    if (!req_validated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = req_validated.message)
      );
    }
    let sent = await UserService.sendTempNotification(req.body);
    if (!sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = sent.message),
        (error = sent.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["sendTempNotification_200"]),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( sendTempNotification ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( sendTempNotification ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const send371AppNotifications = async (req, res) => {
  try {
    // testing app notifications from the ticket - 371
    if (req.query.type == "1") {
      let resp = await UserService.sendFirstScanNotifications();
      if (!resp.success) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = resp.message),
          (error = resp.error),
          (data = null)
        );
      }
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = "Notifications sent successfully"),
        (error = ""),
        (data = resp.data)
      );
    } else if (req.query.type == "2") {
      let resp = await UserService.sendSetDietaryPreferenceNotifications();
      if (!resp.success) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = resp.message),
          (error = resp.error),
          (data = null)
        );
      }
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = "Notifications sent successfully"),
        (error = ""),
        (data = resp.data)
      );
    } else if (req.query.type == "3") {
      let resp =
        await UserService.sendUseProductChoiceAiAssistantNotifications();
      if (!resp.success) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = resp.message),
          (error = resp.error),
          (data = null)
        );
      }
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = "Notifications sent successfully"),
        (error = ""),
        (data = resp.data)
      );
    } else if (req.query.type == "4") {
      let resp = await UserService.sendInactivityNotifications();
      if (!resp.success) {
        return returnResponse(
          (res = res),
          (success = false),
          (statusCode = 400),
          (message = resp.message),
          (error = resp.error),
          (data = null)
        );
      }
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = "Notifications sent successfully"),
        (error = ""),
        (data = resp.data)
      );
    } else {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "Invalid type")
      );
    }
  } catch (error) {
    console.log("Error from function ( send371AppNotifications ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( send371AppNotifications ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const upgradePlan = async (req, res) => {
  try {
    let req_validated = await requestValidator(req.body, ["country"]);
    if (!req_validated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = req_validated.message)
      );
    }
    let plan = await UserService.checkPlanType(req.user.id);
    console.log("plan : ", plan.data.plan_type);
    if (!plan.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = plan.message)
      );
    }
    if (plan.data.plan_type == "yearly") {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["upgradePlan_400_already_exists"])
      );
    }
    let updated = await UserService.changePlan(req.user.id, req.body.country);
    // console.log("updated : ", updated);
    if (!updated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = updated.message),
        (error = updated.error)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["upgradePlan_200"]),
      (error = ""),
      (data = updated.data)
    );
  } catch (error) {
    console.log("Error from function ( upgradePlan ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( upgradePlan ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const degradePlan = async (req, res) => {
  try {
    let req_validated = await requestValidator(req.body, ["country"]);
    if (!req_validated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = req_validated.message)
      );
    }
    let plan = await UserService.checkPlanType(req.user.id);
    if (!plan.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = plan.message)
      );
    }
    if (plan.data.plan_type == "monthly") {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = Messages["degradePlan_400_already_exists"])
      );
    }
    let updated = await UserService.changePlan(req.user.id, req.body.country);
    if (!updated.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = updated.message),
        (error = updated.error)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["degradePlan_200"]),
      (error = ""),
      (data = updated.data)
    );
  } catch (error) {
    console.log("Error from function ( degradePlan ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( degradePlan ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const planUpdateCheck = async (req, res) => {
  try {
    let country = "India";
    let user_plan = await userPlansModel.findOne({
      user_id: new ObjectId("667900822f7642141baec21c"),
    });
    if (user_plan.type != "premium") {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "User is not subscribed to premium plan"),
        (error = ""),
        (data = null)
      );
    }
    if (moment(user_plan.subscription_end_date).isBefore(moment())) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "Subscription is expired"),
        (error = ""),
        (data = null)
      );
    }
    let session = await sessionModel.findOne({
      _id: new ObjectId(user_plan.session_id),
    });
    let subscription = await StripeService.getSubscription(
      session.stripe_subscription_id
    );
    if (!subscription.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = subscription.message),
        (error = subscription.error),
        (data = null)
      );
    }
    console.log(
      "Subscriptions : ",
      moment.unix(subscription.data.current_period_end).format("D MMMM YYYY")
    );
    let sub_item_id = subscription.data.items.data[0].id;
    console.log("Sub Item ID : ", sub_item_id);
    let prices = await priceModel.find({
      plan_id: new ObjectId(session.plan_id),
      country: country,
    });
    let price = prices.filter((price) => price.type != session.plan_type)[0];

    let updated_subscription = await StripeService.updateSubscriptionPrice(
      session.stripe_subscription_id,
      sub_item_id,
      price.stripe_price_id,
      subscription.data.current_period_end
    );
    // console.log("prices", price);

    if (!updated_subscription.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = updated_subscription.message),
        (error = updated_subscription.error),
        (data = null)
      );
    }
    let new_subscription = await StripeService.getSubscription(
      session.stripe_subscription_id
    );
    if (!new_subscription.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = new_subscription.message),
        (error = new_subscription.error),
        (data = null)
      );
    }
    session.current_period_start = new_subscription.data.current_period_start;
    session.current_period_end = new_subscription.data.current_period_end;

    await session.save();

    let updated_plan = await userPlansModel.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
      },
      {
        active: true,
        type: user_plan.type,
        subscription_start_date: moment
          .unix(new_subscription.data.current_period_start)
          .format("YYYY-MM-DD HH:mm:ss"),
        subscription_end_date: moment
          .unix(new_subscription.data.current_period_end)
          .format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        new: true,
      }
    );
    console.log(
      "Updated Subscription : ",
      moment
        .unix(new_subscription.data.current_period_start)
        .format("D MMMM YYYY")
    );
    console.log(
      "Updated Subscription : ",
      moment
        .unix(new_subscription.data.current_period_end)
        .format("D MMMM YYYY")
    );
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["planUpdateCheck_200"]),
      (error = ""),
      (data = updated_plan)
    );
  } catch (error) {
    console.log("Error from function ( planUpdateCheck ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( planUpdateCheck ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const submitPlanChangeRequest = async (req, res) => {
  try {
    await UserService.submitScheduledPlanChangeRequests();
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = "Process started"),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( submitPlanChangeRequest ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( submitPlanChangeRequest ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const cacheDbCheck = async (req, res) => {
  try {
    let product_id = req.body.product_id;
    let resp = await H2OHubService.checkCacheDbForScoring(product_id);
    if (!resp.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = resp.message),
        (error = resp.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = resp.message),
      (error = ""),
      (data = resp.data)
    );
  } catch (error) {
    console.log("Error from function ( cacheDbCheck ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( cacheDbCheck ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const uploadToS3Test = async (req, res) => {
  try {
    let files = req.files;
    console.log("Files : ", files);

    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = ""),
      (error = ""),
      (data = {})
    );
  } catch (error) {
    console.log("Error from function ( uploadToS3Test ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( uploadToS3Test ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    let user = req.user;
    let is_deleted = await UserService.deleteUserPermanently(user.id);
    if (!is_deleted.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = is_deleted.message),
        (error = is_deleted.error),
        (data = null)
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["deleteMyAccount_200"]),
      (error = ""),
      (data = {})
    );
  } catch (error) {
    console.log("Error from function ( deleteMyAccount ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( deleteMyAccount ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const sendProductScoringNotification = async (req, res) => {
  try {
    let sent = await UserService.sendScoringSuccessNotifications(req.app.io);
    if (!sent.success) {
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 400),
        (message = sent.message),
        (error = sent.error),
        (data = {})
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["sendProductScoringNotification_200"]),
      (error = ""),
      (data = {})
    );
  } catch (error) {
    console.log(
      "Error from function ( sendProductScoringNotification ) : ",
      error
    );
    CloudWatchService.logToCloudWatch(
      "Error from function ( sendProductScoringNotification ) : " +
        error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const progressQueueData = async (req, res) => {
  try {
    let data = await UserService.getProgressQueueData(req.user.id);
    if (!data.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = data.message),
        (error = data.error),
        (data = {})
      );
    }
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = Messages["progressQueueData_200"]),
      (error = ""),
      (data = {
        results: data.data,
        count: data?.data && data.data.length ? data.data.length : 0,
      })
    );
  } catch (error) {
    console.log("Error from function ( progressQueueData ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( progressQueueData ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const cloudWatchTest = async (req, res) => {
  try {
    CloudWatchService.logToCloudWatch({
      name: "test",
      event: "Test",
    });
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = ""),
      (error = ""),
      (data = {})
    );
  } catch (error) {
    console.log("Error from function ( cloudWatchTest ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( cloudWatchTest ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const testProductScoreChangedTagCron = async (req, res) => {
  try {
    let dt = await UserService.checkAndUpdateProductScoreUpdatedTags();
    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = ""),
      (error = ""),
      (data = {})
    );
  } catch (error) {
    console.log(
      "Error from function ( testProductScoreChangedTagCron ) : ",
      error
    );
    CloudWatchService.logToCloudWatch(
      "Error from function ( testProductScoreChangedTagCron ) : " +
        error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const getProductPreferenceMatchList = async (req, res) => {
  try {
    let prefernece_data = await UserService.getProductPreferenceMatchList(
      req.user.id,
      req.body.product_id
    );
    if (!prefernece_data.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = prefernece_data.message),
        (error = prefernece_data.error),
        (data = null)
      );
    } else {
      return returnResponse(
        (res = res),
        (success = true),
        (statusCode = 200),
        (message = Messages["getProductPreferenceMatchList_200"]),
        (error = ""),
        (data = prefernece_data.data)
      );
    }
  } catch (error) {
    console.log(
      "Error from function ( getProductPreferenceMatchList ) : ",
      error
    );
    CloudWatchService.logToCloudWatch(
      "Error from function ( getProductPreferenceMatchList ) : " +
        error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};

const subscriptionSuccessNotify = async (req, res) => {
  try {
    let user = await UserService.getUserById(req.user.id);
    if (!user || !user.name || !user.email) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = "Invalid User Id"),
        (error = "Invalid User Id"),
        (data = null)
      );
    }
    // sending email to user
    let email_sent = await EmailService.sendEmail({
      email: [user.email],
      subject: "Welcome to ScoriFi Premium! 🌟",
      template: "premium-plan",
      data: {
        USER_NAME: user.name,
        APP_LINK: process.env.APP_LINK + "/plans",
      },
    });
    if (!email_sent.success) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 400),
        (message = email_sent.error),
        (error = email_sent.error)
      );
    }

    return returnResponse(
      (res = res),
      (success = true),
      (statusCode = 200),
      (message = "Mail sent"),
      (error = ""),
      (data = null)
    );
  } catch (error) {
    console.log("Error from function ( subscriptionSuccessNotify ) : ", error);
    CloudWatchService.logToCloudWatch(
      "Error from function ( subscriptionSuccessNotify ) : " + error.toString()
    );
    return returnInternalErrorResponse(res, error);
  }
};



module.exports = {
  test,
  savePreferences,
  getPreferences,
  updateProfile,
  getMyPreferences,
  getProfile,
  getGuestUserPermission,
  saveSupportQuery,
  saveSession,
  getHistory,
  getHistoryDataById,
  getScoreStatusForProduct,
  getScoreForProduct,
  getProductScoringById,
  likeDislikeProduct,
  getWishlist,
  extractTopProductsForUser,
  betterAlternativesForProduct,
  compareProductsData,
  changeScoring,
  getCategoryByCountry,
  topProducts,
  getProductInfo,
  // saveSubscription,
  // checkSubscription,
  cancelSubscription,
  getPlans,
  getPlanPrices,
  // makePayment,
  // addSubscription,
  createCheckoutSession,
  stripeSessionCallback,
  checkPlanStatus,
  checkUpdatePlanStatus,
  createSubscription,
  checkSubscription,
  updateSubscription,
  sendSubscriptionQuery,
  scheduleSubscription,
  deleteHistoryById,
  deleteUserHistory,
  sendSignupNotification,
  sendPlanExpireNotification,
  sendTempNotification,
  upgradePlan,
  degradePlan,
  planUpdateCheck,
  submitPlanChangeRequest,
  cacheDbCheck,
  deleteHistoryLineItemById,
  uploadToS3Test,
  deleteMyAccount,
  sendProductScoringNotification,
  progressQueueData,
  cloudWatchTest,
  testProductScoreChangedTagCron,
  getProductPreferenceMatchList,
  getPaginatedHistoryDataById,
  getPaginatedHistory,
  subscriptionSuccessNotify,
  getWishlistCategorywise,
  send371AppNotifications,
};

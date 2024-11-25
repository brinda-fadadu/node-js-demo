const express = require("express");
const {
  test,
  createPreference,
  getPreference,
  updatePreference,
  getCustomers,
  updateCustomer,
  exportCustomers,
  getUserHistory,
  getUserHistoryData,
  createCategory,
  getCategories,
  updateCategory,
  getDashboardData,
  blockUser,
  unBlockUser,
  getBlockedUsers,
  addPlan,
  addPrice,
  removePrice,
  updatePlanPrice,
  getUserSubscriptions,
  getUserHistoryDataById,
  getUserByMonth,
  getSubscriptionBaseUsers,
  getSubscriptionBasedUsers,
  getFailedProductsList,
  getProductScoringAnalysis,
} = require("../controllers/admin.controller");
const { authentication } = require("../middlewares/authentication.middleware");
const { authorization } = require("../middlewares/authorization.middleware");
const {
  requestValidator,
} = require("../middlewares/requestValidator.middleware");
const router = express.Router();

// ------------------- Test Route ------------------- //
router.route("/test").get(authentication, authorization, test);

// ------------------- Preferences Route ------------------- //
router
  .route("/create-preference")
  .post(
    authentication,
    authorization,
    requestValidator([
      "nutrition",
      "ingredients__and__processing",
      "sustainability",
      "allergens",
    ]),
    createPreference
  );
router
  .route("/get-preference/:id")
  .get(authentication, authorization, getPreference);
router
  .route("/update-preference/:id")
  .patch(
    authentication,
    authorization,
    requestValidator([
      "nutrition",
      "ingredients__and__processing",
      "sustainability",
      "allergens",
    ]),
    updatePreference
  );

// ------------------- User Related Route ------------------- //
router
  .route("/get-customers")
  .post(
    authentication,
    authorization,
    requestValidator(["filter", "limit", "page", "status"]),
    getCustomers
  );
router
  .route("/update-customer/:id")
  .patch(authentication, authorization, updateCustomer);
router
  .route("/export-customers")
  .post(
    authentication,
    authorization,
    requestValidator(["fields"]),
    exportCustomers
  );

// ------------------- User History Route ------------------- //
router
  .route("/get-users-history")
  .post(
    authentication,
    authorization,
    requestValidator(["limit", "page"]),
    getUserHistory
  );
router
  .route("/get-user-history/:id")
  .get(authentication, authorization, getUserHistoryData);
router
  .route("/get-user-history-data")
  .post(
    authentication,
    authorization,
    requestValidator(["user_id", "history_id"]),
    getUserHistoryDataById
  );

// ------------------- Category Route ------------------- //
router
  .route("/create-category")
  .post(
    authentication,
    authorization,
    requestValidator(["country", "category"]),
    createCategory
  );
router
  .route("/get-categories")
  .get(authentication, authorization, getCategories);
router
  .route("/update-category")
  .patch(
    authentication,
    authorization,
    requestValidator(["id", "categories"]),
    updateCategory
  );

// ------------------- Dashboard Route ------------------- //
router
  .route("/get-dashboard-data")
  .get(authentication, authorization, getDashboardData);
router
  .route("/get-quater-users")
  .get(authentication, authorization, getUserByMonth);
router
  .route("/get-subscriptionbase-users")
  .get(authentication, authorization, getSubscriptionBaseUsers);

router
  .route("/block-user")
  .post(
    authentication,
    authorization,
    requestValidator(["user_id", "reason"]),
    blockUser
  );
router
  .route("/unblock-user")
  .post(
    authentication,
    authorization,
    requestValidator(["user_id"]),
    unBlockUser
  );
router
  .route("/blocked-users")
  .get(authentication, authorization, getBlockedUsers);

// ------------------- Plan Route ------------------- //
router
  .route("/add-plan")
  .post(authentication, authorization, requestValidator(["name"]), addPlan);
router
  .route("/add-plan-price/:id")
  .post(
    authentication,
    authorization,
    requestValidator(["country", "monthly_price", "yearly_price", "currency"]),
    addPrice
  );
router
  .route("/update-plan-price/:id")
  .patch(
    authentication,
    authorization,
    requestValidator(["country", "monthly_price", "yearly_price"]),
    updatePlanPrice
  );

router
  .route("/remove-plan-price/:id")
  .post(
    authentication,
    authorization,
    requestValidator(["country"]),
    removePrice
  );

// ------------------- Subscription Route ------------------- //
router
  .route("/user-subscriptions")
  .post(
    authentication,
    authorization,
    requestValidator(["limit", "page", "status"]),
    getUserSubscriptions
  );
router
  .route("/failed-products-list")
  .get(authentication, authorization, getFailedProductsList);

router
  .route("/get-product-scoring-analysis")
  .get(authentication, authorization, getProductScoringAnalysis);

router
  .route("/get-subscription-user")
  .get(authentication, authorization, getSubscriptionBasedUsers);
module.exports = router;

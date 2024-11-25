const express = require("express");
const {
  askQuestion,
  likeResult,
  unlikeResult,
  getScoreForChoices,
  testBlocking,
  testUnBlocking,
  scoreNow,
} = require("../controllers/question.controller");
const { authentication } = require("../middlewares/authentication.middleware");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const {
  requestValidator,
} = require("../middlewares/requestValidator.middleware");

const storageForSearchImages = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(path.join(__dirname, "../static/uploads"))) {
      fs.mkdirSync(path.join(__dirname, "../static/uploads"));
    }
    if (
      !fs.existsSync(path.join(__dirname, "../static/uploads/question_images"))
    ) {
      fs.mkdirSync(path.join(__dirname, "../static/uploads/question_images"));
    }
    cb(null, "static/uploads/question_images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "." + file.mimetype.split("/")[1]);
  },
});

const uploadForSearchImages = multer({
  limits: {
    // 5MB limit
    fileSize: 5000000,
  },
  fileFilter(req, file, cb) {
    // if(!req.files || req.files.length < 2 || req.files.length > 4){
    //     return cb(new Error("Please provide atleast 2 images and atmost 4 images"),false)
    // }
    // only jpg,jpeg or png allowed
    if (
      !(
        file.originalname.endsWith("jpg") ||
        file.originalname.endsWith("jpeg") ||
        file.originalname.endsWith("png") ||
        file.originalname.endsWith("JPEG") ||
        file.originalname.endsWith("WEBP") ||
        file.originalname.endsWith("PNG")
      )
    ) {
      return cb(new Error("invalid_file_type"));
    }
    return cb(undefined, true);
  },
  storage: storageForSearchImages,
}).array("images", 4);

// multer for s3 bucket upload
function sanitizeFile(file, cb) {
  // Define the allowed extension
  const fileExts = [".png", ".jpg", ".jpeg"];

  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
    path.extname(file.originalname.toLowerCase())
  );

  // Mime type must be an image
  const isAllowedMimeType = file.mimetype.startsWith("image/");

  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true); // no errors
  } else {
    // pass error msg to callback, which can be displaye in frontend
    cb("Please upload image of type jpeg, jpg or png.");
  }
}
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY, // store it in .env file to keep it safe
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_SES_REGION, // this is the region that you select in AWS account
});
const s3Storage = multerS3({
  s3: s3, // s3 instance
  bucket: process.env.AWS_BUCKET_NAME, // change it as per your project requirement
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let full_path =
      "question_images/" + uniqueSuffix + file.mimetype.split("/")[1];
    cb(null, full_path);
  },
});
const uploadToS3 = multer({
  storage: s3Storage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback);
  },
  limits: {
    fileSize: 5000000,
  },
});

// ------------------- Ask Question Route ------------------- //
router.route("/ask").post(
  // uploadForSearchImages,
  uploadToS3.array("images", 4),
  requestValidator(["type", "finger_print"]),
  askQuestion
);
router
  .route("/score-now")
  .post(authentication, requestValidator(["session_id"]), scoreNow);
// ------------------- Result Like-Dislike Route ------------------- //
router
  .route("/like-result")
  .post(authentication, requestValidator(["result_id"]), likeResult);
router
  .route("/dislike-result")
  .post(authentication, requestValidator(["result_id"]), unlikeResult);
// ------------------- Test Routes ------------------- //
router.route("/get-score-for-choices").post(getScoreForChoices);
router.route("/test-blocking").get(testBlocking);
router.route("/test-unblocking").get(testUnBlocking);

module.exports = router;

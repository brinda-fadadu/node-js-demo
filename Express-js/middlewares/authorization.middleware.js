const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { userModel } = require("../models/user.model");
const { returnResponse } = require("../helpers/response_return");

const authorization = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return returnResponse(
        (res = res),
        (success = false),
        (statusCode = 403),
        (message = "Invalid bearer token")
      );
    } else {
      const token = authHeader.split(" ")[1];
      try {
        const {
          data: { id: id, email: email, role: role },
        } = await jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findOne({
          _id: id,
          email: email,
          role: "admin",
        });
        if (!user) {
          return returnResponse(
            (res = res),
            (success = false),
            (statusCode = 401),
            (message = "You are not authorized to access this route.")
          );
        } else {
          req.user = {
            id: user._id,
            token: token,
            email: user.email,
            role: user.role,
          };
          next();
        }
      } catch (error2) {
        if (error2.name === "TokenExpiredError") {
          return returnResponse(
            (res = res),
            (success = false),
            (statusCode = 401),
            (message =
              "Your session has expired. Please log in again to continue")
          );
        } else if (error2.name === "JsonWebTokenError") {
          return returnResponse(
            (res = res),
            (success = false),
            (statusCode = 401),
            (message =
              "Your session has expired. Please log in again to continue")
          );
        } else {
          return returnResponse(
            (res = res),
            (success = false),
            (statusCode = 401),
            (message =
              "Your session has expired. Please log in again to continue"),
            (error =
              "Your session has expired. Please log in again to continue")
          );
        }
      }
    }
  } catch (error) {
    console.log("Error from function ( authorization ) : ", error);
    return res.status(401).json({
      errorMessage: error.toString(),
    });
  }
};

module.exports = {
  authorization,
};

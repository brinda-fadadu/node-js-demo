const dotenv = require("dotenv");
dotenv.config();
const { returnResult } = require("./response_return");
const jwt = require("jsonwebtoken");

const generateToken = async (payload, is_forgot_password_token = false) => {
  try {
    let token = null;
    if (is_forgot_password_token) {
      token = jwt.sign(
        {
          data: payload,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.FORGOT_PASSWORD_EXPIRY_TIME }
      );
    } else {
      token = jwt.sign(
        {
          data: payload,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY_TIME }
      );
    }
    return returnResult(
      (success = true),
      (message = "Token generated"),
      (error = ""),
      (data = token)
    );
  } catch (error) {
    console.log("Error from function ( generateToken ) :", error);
    return returnResult(
      (success = false),
      (message = error.toString()),
      (error = error.toString())
    );
  }
};

const verify_token = async (token) => {
  try {
    const values = await jwt.verify(token, process.env.JWT_SECRET);
    return returnResult(
      (success = true),
      (message = "Token verified"),
      (error = ""),
      (data = values)
    );
  } catch (error) {
    console.log("Error from function ( verify_token ) :", error);
    return returnResult(
      (success = false),
      (message = error.toString()),
      (error = error.toString())
    );
  }
};

module.exports = {
  generateToken,
  verify_token,
};

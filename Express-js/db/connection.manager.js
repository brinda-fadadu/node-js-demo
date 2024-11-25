const dotenv = require("dotenv");
const { userModel } = require("../models/user.model");
const { default: mongoose } = require("mongoose");
dotenv.config();

async function createMongooseInstance() {
  const mongooseInstance = mongoose.createConnection(process.env.DB_URL);
  mongooseInstance["User"] = userModel;
  mongooseInstance.on("connected", () => {});

  mongooseInstance.on("error", (err) => {
    console.error("Worker thread MongoDB connection error:", err);
  });

  return mongooseInstance;
}

module.exports = {
  createMongooseInstance,
};

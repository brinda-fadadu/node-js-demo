const { fingerPrintModel } = require("../models/fingerprint.model");

const findFingerprint = async (id) => {
  try {
    const finger_print = await fingerPrintModel.findOne({
      finger_print: id,
      is_deleted: false,
    });
    return finger_print;
  } catch (error) {
    console.log("Error from function ( findFingerprint ) :", error);
    return null;
  }
};

const saveFingerprint = async (data) => {
  try {
    return await fingerPrintModel.create(data);
  } catch (error) {
    console.log("Error from function ( saveFingerprint ) :", error);
    return null;
  }
};

const removeFingerprint = async (id) => {
  try {
    return await fingerPrintModel
      .find()
      .updateMany(
        { finger_print: id, is_deleted: false },
        { $set: { is_deleted: true } }
      );
  } catch (error) {
    console.log("Error from function ( removeFingerprint ) :", error);
    return null;
  }
};

module.exports = {
  findFingerprint,
  saveFingerprint,
  removeFingerprint,
};

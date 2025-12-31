const { body } = require("express-validator");
const checkValidation = require("../../../shared/middlewares/check-validation");

const verifyLoginRules = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),

  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be a 6 digits number")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  checkValidation,
];

module.exports = verifyLoginRules;

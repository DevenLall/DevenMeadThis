const { body } = require("express-validator");
const checkValidation = require("../../../shared/middlewares/check-validation");

const messages = {
  EN: {
    nameString: "Name must be a string",
    emailRequired: "Email is required",
    emailInvalid: "Email must be a valid email address",
    passwordRequired: "Password is required",
    passwordLength: "Password must be at least 8 characters long",
    passwordNumber: "Password must contain at least one number",
    phoneFormat: "Phone number must be in the format XXX-XXX-XXXX",
    addressString: "Address must be a string",
  },
};

// Helper function to pick the right language
const msg =
  (key) =>
  (_, { req }) =>
    messages[req.cookies.lang || "EN"][key];

const registerRules = [
  body("name").optional().isString().withMessage(msg("nameString")).trim(),

  body("email")
    .notEmpty()
    .withMessage(msg("emailRequired"))
    .isEmail()
    .withMessage(msg("emailInvalid"))
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage(msg("passwordRequired"))
    .isLength({ min: 8 })
    .withMessage(msg("passwordLength"))
    .matches(/\d/)
    .withMessage(msg("passwordNumber")),

  body("phone")
    .optional()
    .matches(/^\d{3}-\d{3}-\d{4}$/)
    .withMessage(msg("phoneFormat")),

  body("address")
    .optional()
    .isString()
    .withMessage(msg("addressString"))
    .trim(),

  checkValidation,
];

module.exports = registerRules;

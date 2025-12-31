const { body } = require("express-validator");
const checkValidation = require("../../../shared/middlewares/check-validation");

const messages = {
  EN: {
    emailRequired: "Email is required",
    emailInvalid: "Email must be a valid email address",
    passwordRequired: "Password is required",
  },
  FR: {
    emailRequired: "L'email est requis",
    emailInvalid: "L'email doit être une adresse valide",
    passwordRequired: "Le mot de passe est requis",
  },
};

// Helper function to pick the right language
const msg =
  (key) =>
  (_, { req }) =>
    messages[req.cookies.lang || "EN"][key];

const loginRules = [
  body("email")
    .notEmpty()
    .withMessage(msg("emailRequired"))
    .isEmail()
    .withMessage(msg("emailInvalid"))
    .normalizeEmail(),

  body("password").notEmpty().withMessage(msg("passwordRequired")),

  checkValidation,
];

module.exports = loginRules;

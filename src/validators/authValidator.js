const { body } = require("express-validator");

const loginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Please enter your email")
    .isEmail()
    .withMessage("Please enter a valid email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters long"),
];

module.exports = { loginValidator };

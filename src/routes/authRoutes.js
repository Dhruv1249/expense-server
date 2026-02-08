const express = require("express");
const authController = require("../controllers/authController");
const { loginValidators } = require("../validators/authValidators");

const router = express.Router();

router.post("/login", loginValidators, authController.login);
router.post("/register", authController.register);
router.post("/is-user-logged-in", authController.isUserLoggedIn);
router.post("/logout", authController.logout);
router.post("/google-auth", authController.googleSso);
router.post("/check-username", authController.checkUsername);
router.post("/complete-google-signup", authController.completeGoogleSignup);

module.exports = router;

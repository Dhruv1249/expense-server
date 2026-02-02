const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/is-user-logged-in", authController.isUserLoggedIn);
router.post("/logout", authController.logout);
router.post("/google-auth", authController.googleSso);
module.exports = router;

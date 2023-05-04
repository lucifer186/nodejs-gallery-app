const express = require("express");

const authController = require("../controllers/auth");

const { check, body } = require("express-validator/check");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.get("/reset", authController.getReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/newpassword", authController.postNewPassword);

router.post("/reset", authController.postReset);

router.post("/login", authController.postLogin);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
    
,
    body("password", 'Plaese enter minimum 6 chracters longs includes some chraters').isLength({min: 6})
      .isAlphanumeric(),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Your confirm password not match with password");
      }

      return true;
    })
  ],
  authController.postSignup
);

router.post("/logout", authController.postLogout);

module.exports = router;

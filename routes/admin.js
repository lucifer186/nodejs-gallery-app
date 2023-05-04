const path = require("path");

const express = require("express");

const adminController = require("../controllers/admin");

const router = express.Router();

const isAuth = require("../middleware/isAuth");

const { body } = require("express-validator/check");

router.get("/add-product", isAuth, adminController.getAddProduct);


router.get("/products", adminController.getProducts);


router.post(
  "/add-product",
  [
    body("title", "Please enter a title").isString().trim(),
   
    body("price", "Don't blank price field").isFloat().trim(),
    body("description", "Please enter some description").isLength({min:5}).trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/edit-product",  [
    body("title").isString().trim(),
   
    body("price").isFloat().trim(),
    body("description").isLength({min:5}).trim(),
  ], isAuth, adminController.postEditProduct);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;

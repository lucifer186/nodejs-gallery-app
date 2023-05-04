const Product = require("../models/product");
const Order = require("../models/order");
const User = require('../models/user')


const stripe = require('stripe')(`${process.env.MONGO_STRIPE_KEY}`)
const pdfKit = require('pdfkit')

const ITEMS_PER_page = 1;

const fs = require("fs");
const path = require("path");

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
 let totalItems;
 Product.find().countDocuments().then(number =>{
   totalItems = number;
  return Product.find().skip((page-1)*ITEMS_PER_page).limit(ITEMS_PER_page)
 }).then((products) => {
  res.render("shop/product-list", {
    prods: products,
    pageTitle: "All products",
    path: "products",
    currentpage: page,
    hasNextPage:ITEMS_PER_page*page < totalItems,
    hasPrev:page > 1,
    nextPage: page + 1,
    previousePage: page - 1,
    lastPage:Math.ceil(totalItems/ITEMS_PER_page)

  })
})
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
 const page = +req.query.page || 1
 let totalItems;
 Product.find().countDocuments().then(number =>{
   totalItems = number;
  return Product.find().skip((page-1)*ITEMS_PER_page).limit(ITEMS_PER_page)
 }).then((products) => {
  res.render("shop/index", {
    prods: products,
    pageTitle: "Shop",
    path: "/",
    currentpage: page,
    hasNextPage:ITEMS_PER_page*page < totalItems,
    hasPrev:page > 1,
    nextPage: page + 1,
    previousePage: page - 1,
    lastPage:Math.ceil(totalItems/ITEMS_PER_page)

  });
}).catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) =>{

  let products;
  let total=0;
  req.user
  .populate("cart.items.productId")
  .execPopulate()
  .then((user) => {
    products = user.cart.items;
    total = 0
    products.forEach(p =>{
      total += p.quantity * p.productId.price  

    })
    
     return stripe.checkout.sessions.create({
       payment_method_types:['card'],
      
       line_items: products.map(p => {
         return {
           name: p.productId.title,
           description: p.productId.description,
           amount: p.productId.price * 100,
           currency: 'usd',
           quantity: p.quantity
         }
       }),

       success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
       cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'

     })
  }).then(session => {
    res.render("shop/checkout", {
      path: "/checkout",
      pageTitle: "Checkout",
      products: products,
      totalSum: total,
      sessionId:session.id
    });
  })
  .catch((err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });

}
exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      console.log(user.cart.items);
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};



exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  // const user = User.email

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized!"));
      }

      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicepath = path.join("data", "invoices", invoiceName);
 
      const pdfTool = new pdfKit();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition','inline; filename="' + invoiceName + '"');
   
        pdfTool.pipe(fs.createWriteStream(invoicepath));
      pdfTool.pipe(res);
      pdfTool.fontSize(40).text("BABEL.in");
      pdfTool.text('--------------')
      pdfTool.fontSize(22).text("Tax Invoice/Bill of Supply/Cash Memo(Original for Recipient)");
      pdfTool.text('--------------------------')
      pdfTool.fontSize(20).text("Billing address");
      pdfTool.fontSize(18).text("Plot no 89A,  Ganesh complex mouza Road, near post office South Bengal, 711322");

      let total_price= 0;
      // let GST = 121;
      pdfTool.text('------------')
      pdfTool.fontSize(23).text("PAN NO: AALCO0178E");
      pdfTool.text('------------')
      order.products.forEach(prd =>{
        total_price += prd.quantity*prd.product.price
        pdfTool.fontSize(18).text(
          prd.product.title +'-'+ prd.quantity + 'x' + '$'+ prd.product.price 
        )
        pdfTool.text('Include GST:' + GST)
        pdfTool.text(`Order Date: ${new Date()}`);
        pdfTool.text(`Order Id: ${orderId}`);
        pdfTool.text('--------')
        pdfTool.fontSize(23).text('Total Price $'+ total_price)
      })


      pdfTool.end()
    })
    .catch((err) => {
      return next(err);
    });
};

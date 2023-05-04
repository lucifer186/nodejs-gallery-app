const Product = require('../models/product');


const filedeleter = require('../util/file')
const  {validationResult  }  = require('express-validator/check')

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasValue:false,
    errorMessage: null,
    isAuthenticated: req.session.isLoggedIn,
    validationErrors:[]
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const error = validationResult(req);
 console.log(image)
 if(!image){
  return res.status(422).render('admin/edit-product', {
    path: '/admin/edit-product',
    pageTitle: 'Add Product',
    errorMessage: 'Please choose image',
    hasValue: true,
    editing: false,
    validationErrors:[],
    product: {
      title:title,
      price:price,
      description:description,
    },
  })
 }

  if(!error.isEmpty()){
    console.log(error.array());
    return res.status(422).render('admin/edit-product', {
      path: '/admin/edit-product',
      pageTitle: 'Add Product',
      errorMessage: error.array()[0].msg,
      hasValue: true,
      editing: false,
      validationErrors:error.array(),
      product: {
        title:title,
        imageUrl:imageUrl,
        price:price,
        description:description,
      },
    })}

    const imageUrl = image.path;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  
  product
    .save()
    .then(result => {
    
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        errorMessage: null,
        hasValue:false,
        product: product,
        validationErrors:[],
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => { const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); });
};

exports.postEditProduct = (req, res, next) => {
  
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const error = validationResult(req);
 

  if(!error.isEmpty()){
    console.log(error.array());
    return res.status(422).render('admin/edit-product', {
      path: '/admin/edit-product',
      pageTitle: 'Edit Product',
      errorMessage: error.array()[0].msg,
      hasValue: true,
      editing: false,
      validationErrors: error.array(),
      product: {
        title: updatedTitle,
        price:updatedPrice,
        description:updatedDesc,
        _id:prodId
      },
    }) }
  
   
  Product.findById(prodId)
    .then(product => {
      if(product.userId.toString() !== req.user._id.toString()){
        res.redirect('/')
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        filedeleter.deleteFile(product.imageUrl)
        product.image = image.path;;

      }
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
         res.redirect('/admin/products');
    })
    
    })
    .catch(err => {
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
  
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product=>{
  if(!product){
    return next(new Error("Can't find"))
  }
  filedeleter.deleteFile(product.imageUrl)
 return Product.deleteOne({ _id:prodId, userId: req.user._id})

  })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

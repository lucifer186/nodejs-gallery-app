const crypto = require('crypto');
const  {validationResult  }  = require('express-validator/check')
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');


const User = require('../models/user');


exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {email:'', password: ''},
      validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: {email: '', password:'',confirmPassword:''},
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const error = validationResult(req);
  if(!error.isEmpty()){
    console.log(error.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: error.array()[0].msg,
      oldInput: {email:email, password: password},
      validationErrors: error.array()
    })
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {

        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password',
          oldInput: {email:email, password: password},
          validationErrors: []
        })
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password',
            oldInput: {email:email, password: password},
            validationErrors: []
          })  



        })
        .catch(err => {
        
          res.redirect('/login');
        });
    })
    .catch(err =>{
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const error = validationResult(req);
  if(!error.isEmpty()){
    console.log(error.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: error.array()[0].msg,
      oldInput: {email:email, password: password, confirmPassword: confirmPassword},
      validationErrors: error.array()
    })
  }
    User.findOne({ email: email }).then((userDoc) => {
        if (userDoc) {
          req.flash('error', 'Email already exist choose different one.');
          return res.redirect('/signup');
        }
      });


     return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
        
        })
        .catch(err => {
          const errormsg = new Error(err)
          errormsg.httpStatusCode = 500;
          return next(errormsg);
        })  .catch(err => {
          const errormsg = new Error(err)
          errormsg.httpStatusCode = 500;
          return next(errormsg); ;
        })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
   
      })
      .catch(err => {
        const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/newpassword',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken:token
      });
    })
    .catch(err => {
      const errormsg = new Error(err)
      errormsg.httpStatusCode = 500;
      return next(errormsg); 
    });
};

exports.postNewPassword = (req, res, next) =>{
  const password = req.body.password
  const userId = req.body.userId
  const passwordToken = req.body.passwordToken
  let resetUser;

  User.findOne({ resetToken: passwordToken , resetTokenExpiration: { $gt: Date.now()}, _id: userId}).then(user => {
    resetUser = user
    return bcrypt.hash(password, 12)
  }).then(hashPassword => {
    resetUser.password = hashPassword;
    resetUser.resetToken = undefined
    resetUser.resetTokenExpiration = undefined

    return resetUser.save()
  }).then(result => {
    res.redirect('/login')
  }).catch(err=> {
    const errormsg = new Error(err)
    errormsg.httpStatusCode = 500;
    return next(errormsg); 
  })
}

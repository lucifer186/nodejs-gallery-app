const User = require('../models/user')
exports.getlogin = (req, res, next) => {
  const isLogginIn = req.get('Cookie').trim().split('=')[1]
        res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login Page',
          isAuthentication: isLogginIn
        });
  };

exports.postlogin = (req, res, next) => {
  
  User.findById("620e15e0a8999b19decd439e")
    .then((user) => {
      req.session.user = user;
  req.session.isLogginIn= true;
    res.redirect('/');
});
}

exports.postlogout = (req, res, next) => {
  
  req.session.destroy(err => {
    const errormsg = new Error(err)
    errormsg.httpStatusCode = 500;
    return next(errormsg); 
    res.redirect('/');
  })
};

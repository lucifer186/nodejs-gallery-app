const path = require('path');
const helmet = require('helmet')
const fs = require('fs')
const csrf = require('csurf')
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer')
const flash =  require('connect-flash')
const MongoDBStore = require('connect-mongodb-session')(session);
const morgan = require('morgan')
const compression = require('compression')


const errorController = require('./controllers/error');
const User = require('./models/user');
const port = process.env.PORT || 3030

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.6x1uh.mongodb.net/${process.env.MONGO_POST}?retryWrites=true&w=majority`

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProctecion = csrf()

const filestorage= multer.diskStorage({
  destination: (req, file, cb) =>{
    cb(null, 'images')
  },
  filename: (req, file, cb) =>{
     cb(null, file.fieldname+ '-'+ Date.now() + path.extname(file.originalname))
  }
})

const filefilter =(req, file, cb) =>{
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
    cb(null, true)
  }else{
    
    cb(null, false)
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const accessStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'), {flags:'a'}
);

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(helmet())
app.use(compression())
app.use(morgan('combined',{ stream: accessStream}))
app.use(multer({storage: filestorage, fileFilter: filefilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProctecion)
app.use(flash())

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res,next) =>{
res.locals.isAuthenticated = req.session.isLoggedIn
res.locals.csrfToken = req.csrfToken();
next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.use(errorController.get404);



mongoose
  .connect(MONGODB_URI)
  .then(result => {
    console.log("CONNECTED!!")
    User.findOne().then(()=>{
      app.listen(port);
      

    });
  })
  .catch(err => {
    console.log(err);
  });

const mongodb = require("mongodb");

const mongoClient = mongodb.MongoClient;

let _db;
const mongoConnect = (callback) => {
  mongoClient.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.6x1uh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
  ).then(client=> {
      _db = client.db('shop');
      console.log('CONNECT')
      callback()
  }).catch(err=> {console.log(err); throw err })
};

const getDb = () =>{
    if(_db){return _db}
    throw 'No database found'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb













// ******** SQL *********//
// const mysql = require('mysql2')

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete',
//     password:'manoj'
// })

// module.exports = pool.promise();

// *********** Sequelize *********
// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('node-complete', 'root', 'manoj', {
//     dialect: 'mysql',
//     host: 'localhost'
// })

// module.exports = sequelize;

'use strict';

var express = require('express'),
  app = express(),
  port = process.env.PORT || 3000,
  Sequelize = require('sequelize'),
  bodyParser = require('body-parser'),
  path = require('path'),
  multer = require('multer'),
  hbs = require('nodemailer-express-handlebars'),
  up = multer(),
  crypto = require('crypto'),
  bcrypt = require('bcrypt'),
  email = process.env.MAILER_EMAIL_ID || 'prioritysubmeteringtest@gmail.com',
  pass = process.env.MAILER_PASSWORD || 'pssidaws12',
  passwordValidator = require('password-validator'),
  nodemailer = require('nodemailer');


  var sequelize = new Sequelize('todo','root','admin',{
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });

  var User = require('./api/models/userModel')(sequelize);

  var smtpTransport = nodemailer.createTransport({
    service: process.env.MAILER_SERVICE_PROVIDER || 'Gmail',
    auth: {
      user: email,
      pass: pass
    }
  });

  var handlebarsOptions = {
    viewEngine: 'handlebars',
    viewPath: path.resolve('./api/templates/'),
    extName: '.html'
  };

  smtpTransport.use('compile', hbs(handlebarsOptions));
// check to see if sequelize is connected.
// sequelize.authenticate()
//   .then(function(err) {
//     console.log('Connection has been established successfully.');
//   })
//   .catch(function (err) {
//     console.log('Unable to connect to the database:', err);
//   });

//passwordValidator
// Create a schema
var schema = new passwordValidator();

// Add properties to it
schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits()                                 // Must have digits
.has().not().spaces()                           // Should not have spaces
//.is().not().oneOf(['Passw0rd', 'Password123', 'Priority1']); // Blacklist these values


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.get("/", up.array(), function(req, res, next){
  return res.sendFile(path.resolve('./public/home.html'));
})

//Forgot Password
app.get("/forgot_password", up.array(), function(req, res, next){
  return res.sendFile(path.resolve('./public/forgot-password.html'));
})

app.post("/forgot_password", up.array(), function(req, res, next){
  // console.log(req);
   User.findOne({ where: {email: req.body.email} })
  .then(function(user){
    return new Promise(function(resolve, reject){
      crypto.randomBytes(20, function(error, buffer) {
        var token = buffer.toString('hex');
        if (error) reject(error);
        else {
              resolve(token);
            //  console.log(token);
        }
      });
    })
    .then(function(token){
      //console.log(user.email);

         User.update(           //new Promise(function(resolve, reject){}
          { reset_password_token: token, reset_password_expires: Date.now() + 86400000 },
          { where: { id: user.id }}
        )
        .then(function(){ //token was originally function argument, may need to put it back.
        //  console.log(user.email);
          var data = {
             to: user.email,
             from: email,
             template: 'forgot-password-email',
             subject: 'Forgot your password?',
             context: {
             url: 'http://localhost:3000/reset_password?token=' + token,
             //http://ec2-34-214-13-200.us-west-2.compute.amazonaws.com
             name: user.fullName.split(' ')[0]
             }
          };
          smtpTransport.sendMail(data, function(error) {
            if (!error) {
              return res.json({ message: 'Kindly check your email for further instructions' });
            } else {
              return res.json({ message: 'There was trouble, please try again' });
            }
          });
        });
    })
  })
})

//Reset Password
app.get("/reset_password", up.array(), function(req, res, next){
  return res.sendFile(path.resolve('./public/reset-password.html'));
})

app.post("/reset_password", up.array(), function(req, res, next) {
   User.findOne({
    where: {
    reset_password_token: req.body.token,
    reset_password_expires: { $gt: Date.now() }
   }
  })
  .then(function(user) {
    if (user) {
      if (req.body.newPassword === req.body.verifyPassword /*&& schema.validate(req.body.newPassword)*/) {
        if(schema.validate(req.body.newPassword)){

          user.hash_password = bcrypt.hashSync(req.body.newPassword, 10);
          // user.reset_password_token = undefined;
          user.reset_password_expires = Date.now() - 86400000;
        //  console.log(user.reset_password_token + " " + user.reset_password_expires);
          user.save().then(function() {

              var data = {
                to: user.email,
                from: email,
                template: 'reset-password-email',
                subject: 'Password Reset Confirmation',
                context: {
                name: user.fullName.split(' ')[0]
                }
              };

          //    console.log(data);

              smtpTransport.sendMail(data, function(error) {
                if (!error) {
                  console.log("password reset");
                  return res.json({ message: 'Password reset' });
                } else {
                  return res.json({message: "error"});
                }
              });
          })
          .catch(function(error){
            console.log(error);
              return res.status(422).send({
                message: error
              });
          })
        } else {
            console.log("password does not follow rules");
            return res.status(422).send({
            message: 'Password does not follow rules'
          });
        }

      } else {
        console.log("passwords do not match");
        return res.status(422).send({
          message: 'Passwords do not match'
        });
      }
    } else {
      console.log("reset token expired");
      return res.status(400).send({
        message: 'Password reset token is invalid or has expired.'
      });
    }
  });
});





app.use(function(req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

module.exports = app;

'use strict';

var Sequelize = require('sequelize'),
    bcrypt = require('bcrypt');

module.exports = function(sequelize){
  var User = sequelize.define('user',{
    fullName: {
      type: Sequelize.STRING,
      field: 'full_name'
    },
    email: {
      type: Sequelize.STRING,
      field: 'email'
    },
    hash_password: {
      type: Sequelize.STRING,
      field: 'password'
    },
    created: {
      type: Sequelize.DATE,
      field: 'created_date'
    },
    reset_password_token: {
      type: Sequelize.STRING,
      field: 'token'
    },
    reset_password_expires: {
      type: Sequelize.DATE,
      field: 'token_expire_date'
    }
  },
  {
    timestamps:false,
    freezeTableName: true
  });

  return User;
}

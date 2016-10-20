'use strict';
const bcrypt = require('bcrypt-nodejs');
// user.js - A sequelize model
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

const Sequelize = require('sequelize');

module.exports = function(sequelize) {
  const User = sequelize.define('User', {
    facebookId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    githubId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    officeId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    freezeTableName: true,
    classMethods: {
      associate(models) {
        User.hasMany(models.Post, {
          as: 'Posts',
          onDelete: 'CASCADE',
          foreignKey: 'postedBy'
        });
        User.hasMany(models.Comment, {
          as: 'Comments',
          onDelete: 'CASCADE',
          foreignKey: 'postedBy'
        });
      },
    }, instanceMethods: {
      comparePassword: function(password) {
        return bcrypt.compareSync(password, this.password);
      },
      createHash: function(password){
          return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
      }
    }
   });

  return User;
};

'use strict';
const bcrypt = require('bcrypt-nodejs');
const url = require('url');

// post.js - A sequelize model
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

const Sequelize = require('sequelize');

module.exports = function(sequelize) {
  const Post = sequelize.define('Post', {
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    text: {
      type: Sequelize.STRING,
      allowNull: true
    },
    url: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    freezeTableName: true,
    getterMethods: {
      root: function(){
        return url.parse(this.url).host;
      }
    },
    classMethods: {
      associate(models) {
        Post.belongsTo(models.User, { foreignKey: 'postedBy' });
        Post.hasMany(models.Comment, {
          onDelete: 'CASCADE',
          foreignKey: 'postedOn'
        });
      },
    },
  });

  return Post;
};

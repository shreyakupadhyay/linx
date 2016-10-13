'use strict';

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
    classMethods: {
      associate() {
        Post.belongsTo(sequelize.models.User, { foreignKey: 'postedBy' });
        Post.hasMany(sequelize.models.Comment, {foreignKey: 'postedOn' });
      },
    },
  });

  return Post;
};

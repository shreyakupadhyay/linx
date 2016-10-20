'use strict';

// comment.js - A sequelize model
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

const Sequelize = require('sequelize');

module.exports = function(sequelize) {
  const Comment = sequelize.define('Comment', {
    text: {
      type: Sequelize.TEXT,
      allowNull: false
    }
  }, {
    freezeTableName: true,
    classMethods: {
      associate(models) {
        Comment.belongsTo(models.User, { foreignKey: 'postedBy' });
        Comment.belongsTo(models.Post, { foreignKey: 'postedOn' });
      },
    },
  });

  return Comment;
};

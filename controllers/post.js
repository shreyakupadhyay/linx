const Post = require('../models').Post;
const User = require('../models').User;
const paginate = require('express-paginate');
exports.getIndex = (req, res, next) => {
  Post.count().then(pageCount => {
    pageCount = Math.floor(pageCount /req.query.limit);
    Post.findAll({
      limit: req.query.limit,
      offset: req.skip,
      order: [['createdAt', 'DESC']],
      include: [ User ]
    }).then(posts => {
      // var chainer = new Sequelize.Utils.QueryChainer();
      // posts.forEach(function(post) {
      //     chainer.add(post.getUser().then(user => {
      //         theBrand.postedBy = user;
      //     }, next));
      // });
      // chainer.runSerially().then(results => {
        res.render('index', {
          posts: posts,
          pageCount: pageCount,
          pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
        });
      // }, next);
    }, next);
  }, next);
};

exports.getSubmit = (req, res, next) => {
  res.render('submit', {
    title: 'Submit a Post',
    errors: req.flash('errors')
  });
};

/**
 * POST /submit
 * Submit a post for discussion
 */
exports.postSubmit = (req, res, next) => {
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('url', 'Need a valid URL').isValidUrl();
  req.sanitize('text').escape().trim();

  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    console.log(errors);
    return res.redirect('/submit');
  }
  var post = Post.build({
    title: req.body.title,
    url: req.body.url,
    text: req.body.text,
  });
  post.setUser(req.user);
  post.save().then(post => {
      res.send(JSON.stringify(post));
  }, next);
};

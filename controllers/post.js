const Post = require('../models').Post;
const User = require('../models').User;
const Comment = require('../models').Comment;
const paginate = require('express-paginate');
const url = require('url');

var setPost = req => {
  return Post.find({ where: { id: req.params.id } });
}

var authorized = (req, res, item) => {
  if(req.isAuthenticated() && req.user.id === item.postedBy)
    return true;
  else {
    req.flash('errors', {msg: 'Not Authorized to view this page!'});
    req.session.returnTo = req.url
    return res.redirect('/login');
  }
}
exports.getIndex = (req, res, next) => {
  Post.count().then(pageCount => {
    pageCount = Math.floor(pageCount /req.query.limit);
    Post.findAll({
      limit: req.query.limit,
      offset: req.skip,
      order: [['createdAt', 'DESC']],
      include: [ User ]
    }).then(posts => {
        posts.map(post => {
          if(post.url)
            post.root = url.parse(post.url).host;
            // post = Object.assign({},post,root);
        });
        res.render('post/index', {
          posts: posts,
          pageCount: pageCount,
          pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
        });
    }, next);
  }, next);
};

exports.getStory = (req, res, next) => {
  Post.find({
    where: {id: req.params.id},
    include: [ User, { model: Comment, include: [User]} ]
  }).then(post => {
    if(post.url)
      post.root = url.parse(post.url).host;
    res.render('post/story', { post: post });
  });
};

exports.getSubmit = (req, res, next) => {
  res.render('post/submit', {
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
      res.redirect('/story'+post.id);
  }, next);
};

exports.postComment = (req, res, next) => {
  req.sanitize('text').trim() ;
  const errors = req.validationErrors();
  if (errors) {
    req.flash('errors', errors);
    console.log(errors);
    return res.redirect('/story/'+req.params.id);
  }
  console.log(req.body.text);
  var comment = Comment.build({
    text: req.body.text
  });
  var post = setPost(req);
  comment.setUser(req.user);
  comment.save().then(comment => {
    post.then(post => {
      comment.setPost(post);
      res.redirect('/story/'+req.params.id);
    }, next);
  }, next);
};

exports.getEdit = (req, res, next) => {
  setPost(req).then(post => {
    authorized(req, res, post);
    res.render('post/edit', {
      post: post
    });
  })
};

exports.postEdit = (req, res, next) => {
  setPost(req).then(post => {
    authorized(req, res, post);
    req.assert('title', 'Title cannot be blank').notEmpty();
    req.assert('url', 'Need a valid URL').isValidUrl();
    req.sanitize('text').escape().trim();

    const errors = req.validationErrors();
    if (errors) {
      req.flash('errors', errors);
      console.log(errors);
      return res.redirect('/story/'+req.params.id);

    }
    post.title = req.body.title;
    post.url = req.body.url;
    post.text = req.body.text;
    post.save().then(post => {
      res.redirect('/story/'+req.params.id);
    }, next);
  }, next);
};

exports.postDelete = (req, res, next) => {
  setPost(req).then(post => {
    authorized(req, post);
    if(req.body.delete != post.id){
      console.log("hash");
      return res.redirect('/story/'+post.id+'/edit');
    }
    post.destroy().then(() => {
      res.redirect('/');
    }, next);
  }, next);
};

exports.getCommentDelete = (req, res, next) => {
  Comment.findById(req.params.id).then(comment => {
    authorized(req, res, comment);
    comment.destroy().then(() => {
      res.redirect(req.headers.referer);
    }, next);
  }, next);
};

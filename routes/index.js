var express = require('express');
var router = express.Router();
const userController = require('../controllers/user');
const postController = require('../controllers/post');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	req.session.returnTo = req.url
	res.redirect('/login');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', postController.getIndex);

	router.get('/login', userController.getLogin);
	// router.post('/login', userController.postLogin);
	// router.get('/register', userController.getRegister);
	// router.post('/register', userController.postRegister);

	router.get('/submit', isAuthenticated, postController.getSubmit);
	router.post('/submit', isAuthenticated, postController.postSubmit);

	router.get('/story/:id', postController.getStory);
	router.post('/story/:id/comment', isAuthenticated, postController.postComment);

	router.get('/story/:id/edit', isAuthenticated, postController.getEdit);
	router.post('/story/:id/edit', isAuthenticated, postController.postEdit);
	router.post('/story/:id/delete', isAuthenticated, postController.postDelete);

	router.get('/comment/:id/delete', isAuthenticated, postController.getCommentDelete);
	/**
	 * OAuth authentication routes. (Sign in)
	 */
	router.get('/auth/office', passport.authenticate('azureoauth'));
	router.get('/auth/office/callback', passport.authenticate('azureoauth', { failureRedirect: '/login' }), (req, res) => {
		console.log(req.session.returnTo);
	  res.redirect(req.session.returnTo || '/');
	});
	// router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
	// router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
	// 	console.log("JSON.serialize");
	// 	res.redirect(req.headers.referer || '/');
	// });
	// router.get('/auth/github', passport.authenticate('github'));
	// router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
	//   res.redirect(req.session.returnTo || '/');
	// });
	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/logout', userController.logout);

	return router;
}

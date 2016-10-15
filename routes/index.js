var express = require('express');
var router = express.Router();
const userController = require('../controllers/user');

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		if(isAuthenticated())
			res.send("he");
		res.render('index', { errors: req.flash('message') });
	});

	router.get('/login', userController.getLogin);
	router.post('/login', userController.postLogin);
	router.get('/register', userController.getRegister);
	router.post('/register', userController.postRegister);


	/**
	 * OAuth authentication routes. (Sign in)
	 */
	router.get('/auth/office', passport.authenticate('azureoauth'));
	router.get('/auth/office/callback', passport.authenticate('azureoauth', { failureRedirect: '/login', successRedirect: '/' }), (req, res) => {
	  res.redirect(req.session.returnTo || '/');
	});
	router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }));
	router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', successRedirect: '/' }), (req, res) => {
		console.log("JSON.serialize");
	  res.redirect('/');
	});
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

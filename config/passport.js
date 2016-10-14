const passport = require('passport');
const config = require('./config.json')[process.env.ENV];
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GithubStrategy = require('passport-github').Strategy;
const AzureOAuthStrategy = require('passport-azure-oauth').Strategy;


const User = require('../models/').User;

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    return done(err, user);
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback : true
  }, (email, password, done) => {
  User.findOne({ where: {email: email.toLowerCase()} })
  .then((err, user) => {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      if (!comparePassword(user, password)){
          console.log('Invalid Password');
          return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
      }
      // User and password both match, return user from done method
      // which will be treated like success
      return done(null, user);
    });
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  clientID: config.FACEBOOK_ID,
  clientSecret: config.FACEBOOK_SECRET,
  callbackURL: '/auth/facebook/callback',
  profileFields: ['name', 'email', 'link', 'locale', 'timezone'],
  passReqToCallback: true
  }, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ where: { facebookId: profile.id }})
		.then((err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(err);
      } else {
        User.findById(req.user.id, (err, user) => {
          if (err) { return done(err); }
          user.facebookId     = profile.id; // set the users facebook id
          user.save().then((err) => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ where: { facebookId: profile.id }})
		.then((err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ where: { email: profile._json.email }})
			.then((err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          return done(err);
        } else {
          var user = User.build();
          user.facebookId = profile.id;
          user.email = profile._json.email;
          user.password = accessToken;
          user.username = (profile.name.givenName + '_' + profile.name.familyName).toLowerCase();
          user.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
          user.save().then((err) => {
            return done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with Office365.
 */
passport.use(new AzureOAuthStrategy({
  clientId    : config.AzureOAuth_ClientId,
  clientSecret: config.AzureOAuth_ClientSecret,
  tenantId    : config.AzureOAuth_AppTenantId,
  resource    : config.AzureOAuth_AuthResource,
  redirectURL : config.AzureOAuth_RedirectURL,
  user        : config.AzureOAuth_User
  }, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ where: { officeId: profile.username }})
		.then((err, existingUser) => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Office365 account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(err);
      } else {
        User.findById(req.user.id).then((err, user) => {
          if (err) { return done(err); }
          user.officeId = profile.id;
          user.save().then((err) => {
            req.flash('info', { msg: 'Office365 account has been linked.' });
            return done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({ where: { officeId: profile.id }})
		.then((err, existingUser) => {
      if (err) { return done(err); }
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ where: { email: profile.username }})
			.then((err, existingEmailUser) => {
        if (err) { return done(err); }
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Office365 manually from Account Settings.' });
          return done(err);
        } else {
          const user = User.build();
          user.email = profile.username;
          user.officeId = profile.id;
          user.password = user.createHash(accessToken);
          user.username = profile.username.split("@")[0];
          user.name = profile.displayname;
          user.save().then((err) => {
            return done(err, user);
          });
        }
      });
    });
  }
}));


/**
 * Login Required middleware.
 */
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = (req, res, next) => {
  const provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, { kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};

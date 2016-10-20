const passport = require('passport');
const config = require('./config.json')[process.env.ENV];
const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GithubStrategy = require('passport-github').Strategy;
const AzureOAuthStrategy = require('passport-azure-oauth').Strategy;


const User = require('../models/').User;

passport.serializeUser((user, done) => {
  console.log("serializing");
  return done(null, user.id);
});

passport.deserializeUser((id, done) => {
  console.log("deserializing");
  User.findById(id).then(user => {
    return done(null, user);
  }, done);
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback : true
  }, (req, email, password, done) => {
  User.findOne({ where: {email: email.toString().toLowerCase()} })
  .then(user => {
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      if (!user.comparePassword(password)){
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
		.then(existingUser => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        return done(null, false);
      } else {
        User.findById(req.user.id).then(user => {
          user.facebookId     = profile.id; // set the users facebook id
          user.save().then(user => {
            req.flash('info', { msg: 'Facebook account has been linked.' });
            return done(null, user);
          }, done);
        }, done);
      }
    }, done);
  } else {
    User.findOne({ where: { facebookId: profile.id }})
		.then(existingUser => {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ where: { email: profile._json.email }})
			.then(existingEmailUser => {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.' });
          done(null, false);
        } else {
          var user = User.build();
          user.facebookId = profile.id;
          user.email = profile._json.email;
          user.password = accessToken;
          user.username = (profile.name.givenName + '_' + profile.name.familyName).toString().toLowerCase();
          user.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
          user.save().then(user => {
            done(null, user);
          }, done);
        }
      }, done);
    }, done);
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
  user        : config.AzureOAuth_User,
  passReqToCallback: true
  }, (req, accessToken, refreshToken, profile, done) => {
  if (req.user) {
    User.findOne({ where: { officeId: profile.username }})
		.then(existingUser => {
      if (existingUser) {
        req.flash('errors', { msg: 'There is already a Office365 account that belongs to you. Sign in with that account or delete it, then link it with your current account.' });
        done(null, false);
      } else {
        User.findById(req.user.id).then(user => {
          user.officeId = profile.id;
          user.save().then(user => {
            req.flash('info', { msg: 'Office365 account has been linked.' });
            done(null, user);
          }, done);
        }, done);
      }
    }, done);
  } else {
    User.findOne({ where: { officeId: profile.username }})
		.then(existingUser => {
      if (existingUser) {
        return done(null, existingUser);
      }
      User.findOne({ where: { email: profile.username }})
			.then(existingEmailUser => {
        if (existingEmailUser) {
          req.flash('errors', { msg: 'There is already an account using this email address. Sign in to that account and link it with Office365 manually from Account Settings.' });
          done(null, false);
        } else {
          const user = User.build();
          user.email = profile.username;
          user.officeId = profile.username;
          user.password = user.createHash(accessToken);
          user.username = profile.username.split("@")[0];
          user.name = profile.displayname.substring(0, profile.displayname.indexOf(" undefined"));;
          user.save().then(user => {
            done(null,user);
          }, done);
        }
      }, done);
    }, done);
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

  if (req.user.tokens.find({ kind: provider })) {
    next();
  } else {
    res.redirect(`/auth/${provider}`);
  }
};

// BASE SETUP
// =============================================================================

var express = require('express');
var	bodyParser = require('body-parser');
var	passport = require('passport');
var	session = require('express-session');
var	flash = require('express-flash');
var expressValidator = require('express-validator');
var	pug = require('pug');
var paginate = require('express-paginate');
var validUrl = require('valid-url');
var moment = require('moment');
/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');


var	models = require("./models");
var app = express();
var env = app.get('env') == 'production' ? 'production' : 'development';
var FileStore = require('session-file-store')(session);

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public/', express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');
app.use(expressValidator({
 customValidators: {
    isValidUrl: function(urlSuspect) {
      if(urlSuspect){
        var result = validUrl.isHttpUri(urlSuspect) || validUrl.isHttpsUri(urlSuspect);
        console.log(result);
        return !(result===undefined);
      }
      return true;
    }
 }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(paginate.middleware(3,50));
app.use(function (req, res, next) {
  var origRender = res.render;
  res.render = function (view, locals, callback) {
    if ('function' == typeof locals) {
      callback = locals;
      locals = undefined;
    }
    if (!locals) {
      locals = {};
    }
    locals.req = req;
    locals.moment = moment;
    locals.errors = req.flash('errors');
    origRender.call(res, view, locals, callback);
  };
  next();
});
var routes = require('./routes/index')(passport);
app.use('/', routes);
app.use(function(err, req, res, next) {
  console.log("\n\ntisis the error\n\n");
  console.error(err);
  console.log("\n\n\n\n")
  next(err);
  // res.status(500).send('Something broke!');
});
var port = process.env.PORT || 8080;


models.sequelize.sync().then(function () {
	var server = app.listen(port, function() {
		console.log('Express server listening on port ' + server.address().port);
	});
});

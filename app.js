// BASE SETUP
// =============================================================================

var express = require('express');
var	bodyParser = require('body-parser');
var	passport = require('passport');
var	session = require('express-session');
var	flash = require('express-flash');
var expressValidator = require('express-validator');
var	pug = require('pug');

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
app.use(expressValidator());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get('/test', function(req, res) {
  res.send('this works');
});
var routes = require('./routes/index')(passport);
app.use('/', routes);

var port = process.env.PORT || 8080;


models.sequelize.sync().then(function () {
	var server = app.listen(port, function() {
		console.log('Express server listening on port ' + server.address().port);
	});
});

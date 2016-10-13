// BASE SETUP
// =============================================================================

var express = require('express');
var	bodyParser = require('body-parser');
var	passport = require('passport');
var	session = require('express-session');
var	flash = require('express-flash');
var	pug = require('pug');

var	models = require("./models");
var app = express();
var env = app.get('env') == 'production' ? 'production' : 'development';
var FileStore = require('session-file-store')(session);

app.use(session({
    store: new FileStore,
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public/', express.static('public'));
app.set('views', './views');
app.set('view engine', 'pug');

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

var initPassport = require('./passport/init');
initPassport(passport);

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

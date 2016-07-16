// dependencies ============================================================

const express = require('express');
const stylus = require('stylus');
const path = require('path');
const compress = require('compression');
const app = express();
const mongoose = require('mongoose');
const db = mongoose.connection;
const keys = require('./lib/keys');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');

// express settings ======================================================

app.use(require('morgan')('dev'));
// app.use(logger('common', {
//     stream: fs.createWriteStream('./access.log', {flags: 'a'})
// }));

mongoose.connect(keys.db);
db.on('error', console.error.bind(console, 'connection error:'));
app.use(compress()); // place high to ensure that everything is compressed
app.use(cookieParser());
app.use(session({
	secret: keys.cookie,
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		collection: 'nightlightSessions',
	}),
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 604800000,
	},
}));

app.set('view engine', 'pug');
// app.set('views', './views');

function compile(str, sPath) {
	return stylus(str)
		.set('filename', sPath)
		.set('compress', true);
}

app.use(stylus.middleware({
	src: path.join(__dirname, 'stylesheets'),
	dest: path.join(__dirname, 'static/css'),
	compile,
}));

// other middleware ======================================================

app.use(bodyParser.urlencoded({
	extended: true,
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'static')));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./controllers/passport')(passport);
require('./routes')(app, passport);
// let's dance! =========================================================

app.listen((process.env.PORT || 3000));

const zomato = require('./controllers/zomato');
const going = require('./controllers/going');
const User = require('./models/user');
let loggedIn = false;

// require all the handlers here
module.exports = (app, passport) => {
	app.use((request, response, next) => { // custom middleware
		loggedIn = false;
		if (request.isAuthenticated()) {
			loggedIn = true;
			if (request.session.lastSearch) {
				User.findOneAndUpdate({ 'local.username': request.user.local.username }, {
					$set: { 'local.lastSearch': request.session.lastSearch },
				}, (err, doc) => { delete request.session.lastSearch; });
			}
			if (request.session.places) {
				User.findOneAndUpdate({ 'local.username': request.user.local.username }, {
					$addToSet: { 'local.places': { $each: request.session.places } },
				}, (err, doc) => { delete request.session.places; });
			}
		}
		next();
	});

	app.get('/', (request, response) => {
		if (loggedIn) {
			if (request.user.local.lastSearch) {
				console.log('Restoring account.lastsearch');
				response.redirect('/search');
			} else {
				response.render('landing', {
					loggedIn,
				});
			}
		} else if (request.session.lastSearch) {
			console.log('Restoring sid.lastsearch');
			response.redirect('/search');
		} else {
			response.render('landing', {
				loggedIn,
			});
		}
	});
	app.get('/about', (request, response) => {
		response.render('about', {
			loggedIn,
		});
	});
	app.get('/login', (request, response) => {
		if (loggedIn) {
			response.redirect('/');
		} else {
			response.render('login', { message: request.flash('error') });
		}
	});
	app.post('/login', passport.authenticate('local', {
		successRedirect: '/search',
		failureRedirect: '/login',
		failureFlash: true,
	}));
	app.get('/logout', (request, response) => {
		request.logout();
		request.session.destroy();
		response.redirect('/');
	});
	app.get('/search', (request, response) => {
		if (request.query.city) {
			zomato.getCity(request.query.city, response, request, loggedIn);
		} else if (request.session.lastSearch) {
			console.log('Last search detected: ' + request.session.lastSearch);
			zomato.getCity(request.session.lastSearch, response, request, loggedIn);
		} else if (request.user.local.lastSearch) {
			console.log('Account last search: ' + request.user.local.lastSearch);
			zomato.getCity(request.user.local.lastSearch, response, request, loggedIn);
		} else {
			response.render('landing', {
				loggedIn,
			});
		}
	});
	app.post('/going', (request, response) => {
		going(request, response, loggedIn);
	});

	app.use((request, response) => {
		response.status(404);
		response.render('error');
	});
};

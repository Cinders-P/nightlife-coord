const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;

module.exports = (passport) => {
	passport.serializeUser((user, done) => {
		done(null, user._id);
	});

	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => {
			done(err, user);
		});
	});

	passport.use(new LocalStrategy({
		passReqToCallback: true,
	},
		(request, username, password, done) => {
			User.findOne({ 'local.username': username }, (err, user) => {
				process.nextTick(() => {
					if (err) {
						return done(err, false, request.flash('error', 'There was an error processing your request.'));
					} else if (!user) {
						if ((password.length < 4) || (username.length < 4)) {
							return done(null, false, request.flash('error', 'Your username and password must be at least 4 characters.'));
						}
						const newUser = new User();
						if (request.session.lastSearch) {
							newUser.local.lastSearch = request.session.lastSearch;
							delete request.session.lastSearch;
						}
						if (request.session.places) {
							newUser.local.places = request.session.places;
							delete request.session.places;
						}
						newUser.local.username = username;
						newUser.local.password = newUser.generateHash(password);

						newUser.save((err) => {
							console.log('creating new user');
							if (err) throw err;
							return done(null, newUser);
						});
					} else if (!user.validPassword(password)) {
						return done(null, false, request.flash('error', 'Incorrect password.'));
					} else {
						console.log('logging in user');
						return done(null, user);
					}
				});
			});
		}));
};

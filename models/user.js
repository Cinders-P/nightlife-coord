const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const UserSchema = mongoose.Schema({
	local: {
		username: String,
		password: String,
		places: { type: [Number], default: [0] },
		lastSearch: String,
	},
	facebook: {
		name: String,
		token: String,
		id: String,
		places: [Number],
		lastSearch: String,
	},
	twitter: {
		username: String,
		token: String,
		id: String,
		places: [Number],
		lastSearch: String,
	},
});

UserSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.local.password);
};

const User = mongoose.model('nightlightUser', UserSchema);
module.exports = User;

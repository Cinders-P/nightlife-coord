const Restaurant = require('../models/restaurant');
const User = require('../models/user');

module.exports = (request, response, loggedIn) => {
	if (loggedIn) {
		const user = User.where({ 'local.username': request.user.local.username });
		user.findOne((err, guy) => {
			let included = false;
			for (let i = 0; i < guy.local.places.length; i++) {
				if (guy.local.places[i] == request.body.zid) included = true;
			}
			if (included) {
				user.update({ $pull: { 'local.places': request.body.zid } }).exec();
				Restaurant.findOneAndUpdate({ zid: request.body.zid }, {
					$inc: { count: -1 },
				}, (err, doc) => {});
			} else {
				user.update({ $push: { 'local.places': request.body.zid } }).exec();
				Restaurant.findOneAndUpdate({ zid: request.body.zid }, {
					$inc: { count: 1 },
				}, { upsert: true }, (err, doc) => {});
			}
		});
	} else {
		if (!request.session.places) {
			request.session.places = [];
		}
		if (request.session.places.includes(request.body.zid)) {
			request.session.places.splice(request.session.places.indexOf(request.body.zid), 1);
			Restaurant.findOneAndUpdate({ zid: request.body.zid }, {
				$inc: { count: -1 },
			}, (err, doc) => {});
		} else {
			request.session.places.push(request.body.zid);
			Restaurant.findOneAndUpdate({ zid: request.body.zid }, {
				$inc: { count: 1 },
			}, { upsert: true }, (err, doc) => {});
		}
	}
	response.end();
};
